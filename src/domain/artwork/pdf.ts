import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRef, PDFStream, type PDFContext, type PDFObject } from 'pdf-lib';
import type { ArtworkPage, Rotation, SizeMm, SizeSource } from './types';
import { MM_PER_PT, roundMm, toSize } from './units';

const N = {
  MediaBox: PDFName.of('MediaBox'),
  CropBox: PDFName.of('CropBox'),
  TrimBox: PDFName.of('TrimBox'),
  BleedBox: PDFName.of('BleedBox'),
  Rotate: PDFName.of('Rotate'),
  UserUnit: PDFName.of('UserUnit'),
  Parent: PDFName.of('Parent'),
  Resources: PDFName.of('Resources'),
  XObject: PDFName.of('XObject'),
  Contents: PDFName.of('Contents'),
  Subtype: PDFName.of('Subtype'),
  Form: PDFName.of('Form'),
};

interface Rect {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const resolve = (ctx: PDFContext, obj: PDFObject | undefined): PDFObject | undefined =>
  obj instanceof PDFRef ? ctx.lookup(obj) : obj;

/** An attribute of a page, looked up the page tree for the inheritable ones (MediaBox, CropBox, Rotate, Resources). */
function inherited(ctx: PDFContext, node: PDFDict, key: PDFName): PDFObject | undefined {
  const seen = new Set<PDFDict>();
  for (let current: PDFObject | undefined = node; current instanceof PDFDict && !seen.has(current); ) {
    seen.add(current);
    const value = current.get(key);
    if (value !== undefined) return value;
    current = resolve(ctx, current.get(N.Parent));
  }
  return undefined;
}

function numberOf(ctx: PDFContext, obj: PDFObject | undefined): number | null {
  const value = resolve(ctx, obj);
  return value instanceof PDFNumber && Number.isFinite(value.asNumber()) ? value.asNumber() : null;
}

/** A PDF rectangle, normalized: corners may be given in any order and with negative coordinates. */
function rectOf(ctx: PDFContext, obj: PDFObject | undefined): Rect | null {
  const array = resolve(ctx, obj);
  if (!(array instanceof PDFArray) || array.size() !== 4) return null;
  const n = [0, 1, 2, 3].map((i) => numberOf(ctx, array.get(i)));
  if (n.some((v) => v === null)) return null;
  const [a = 0, b = 0, c = 0, d = 0] = n as number[];
  const rect = { x1: Math.min(a, c), y1: Math.min(b, d), x2: Math.max(a, c), y2: Math.max(b, d) };
  return rect.x2 > rect.x1 && rect.y2 > rect.y1 ? rect : null;
}

function intersect(a: Rect, b: Rect): Rect | null {
  const r = { x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), x2: Math.min(a.x2, b.x2), y2: Math.min(a.y2, b.y2) };
  return r.x2 > r.x1 && r.y2 > r.y1 ? r : null;
}

const sameRect = (a: Rect, b: Rect) =>
  Math.abs(a.x1 - b.x1) < 0.01 && Math.abs(a.y1 - b.y1) < 0.01 && Math.abs(a.x2 - b.x2) < 0.01 && Math.abs(a.y2 - b.y2) < 0.01;

export function normalizeRotation(degrees: number): Rotation {
  return ((((Math.round(degrees / 90) * 90) % 360) + 360) % 360) as Rotation;
}

const encoder = new TextEncoder();

function streamBytes(obj: PDFObject | undefined): Uint8Array | null {
  return obj instanceof PDFStream ? obj.getContents() : null;
}

/** Raw bytes of the XObjects a page uses, by sorted resource name, recursing into form XObjects. */
function pushXObjects(ctx: PDFContext, parts: Uint8Array[], resources: PDFObject | undefined, depth: number, seen: Set<PDFObject>) {
  if (!(resources instanceof PDFDict) || depth > 3) return;
  const xobjects = resolve(ctx, resources.get(N.XObject));
  if (!(xobjects instanceof PDFDict)) return;
  const entries = xobjects
    .entries()
    .map(([name, value]) => [name.toString(), value] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [name, value] of entries) {
    parts.push(encoder.encode(`${name}=`));
    const obj = resolve(ctx, value);
    if (obj === undefined || seen.has(obj)) continue;
    seen.add(obj);
    const bytes = streamBytes(obj);
    if (bytes) parts.push(bytes);
    if (obj instanceof PDFStream && obj.dict.get(N.Subtype) === N.Form) {
      pushXObjects(ctx, parts, resolve(ctx, obj.dict.get(N.Resources)), depth + 1, seen);
    }
  }
}

/** SHA-256 over the page geometry, its content streams and the XObjects they draw (first 16 hex chars). */
async function contentKey(ctx: PDFContext, node: PDFDict, size: SizeMm, printSize: SizeMm): Promise<string> {
  const parts: Uint8Array[] = [encoder.encode(`${size.widthMm}x${size.heightMm}/${printSize.widthMm}x${printSize.heightMm}|`)];
  const contents = resolve(ctx, node.get(N.Contents));
  if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      const bytes = streamBytes(resolve(ctx, contents.get(i)));
      if (bytes) parts.push(bytes);
    }
  } else {
    const bytes = streamBytes(contents);
    if (bytes) parts.push(bytes);
  }
  pushXObjects(ctx, parts, resolve(ctx, inherited(ctx, node, N.Resources)), 0, new Set());
  const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    all.set(part, offset);
    offset += part.length;
  }
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', all));
  return Array.from(digest.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function analyzePage(ctx: PDFContext, node: PDFDict, index: number): Promise<ArtworkPage | null> {
  const media = rectOf(ctx, inherited(ctx, node, N.MediaBox));
  if (!media) return null;
  const crop = rectOf(ctx, inherited(ctx, node, N.CropBox));
  const visible = (crop && intersect(crop, media)) ?? media;
  const trimRaw = rectOf(ctx, node.get(N.TrimBox));
  const trim = trimRaw ? intersect(trimRaw, visible) : null;
  const bleedRaw = rectOf(ctx, node.get(N.BleedBox));
  const bleedBox = bleedRaw ? intersect(bleedRaw, visible) : null;

  const userUnit = numberOf(ctx, node.get(N.UserUnit));
  const mmPerUnit = MM_PER_PT * (userUnit !== null && userUnit > 0 ? userUnit : 1);
  const rotation = normalizeRotation(numberOf(ctx, inherited(ctx, node, N.Rotate)) ?? 0);
  const swap = rotation === 90 || rotation === 270;
  const sizeOf = (r: Rect): SizeMm => {
    const w = (r.x2 - r.x1) * mmPerUnit;
    const h = (r.y2 - r.y1) * mmPerUnit;
    return swap ? toSize(h, w) : toSize(w, h);
  };

  const printRect = bleedBox ?? visible;
  let bleedMm: number | null = null;
  if (trim) {
    const margins = [trim.x1 - printRect.x1, trim.y1 - printRect.y1, printRect.x2 - trim.x2, printRect.y2 - trim.y2].map(
      (m) => m * mmPerUnit,
    );
    const min = Math.min(...margins);
    if (min > -0.01 && Math.max(...margins) - min <= 0.2) bleedMm = roundMm(margins.reduce((a, b) => a + b, 0) / 4);
  }

  const sizeSource: SizeSource = trim ? 'trimbox' : crop && !sameRect(visible, media) ? 'cropbox' : 'mediabox';
  const size = sizeOf(trim ?? visible);
  const printSize = sizeOf(printRect);
  let key: string | null = null;
  try {
    key = await contentKey(ctx, node, size, printSize);
  } catch {
    key = null;
  }
  return { index, size, sizeSource, printSize, bleedMm, rotation, contentKey: key };
}

export interface PdfResult {
  readonly pages: ArtworkPage[];
  readonly title: string | null;
  readonly encrypted: boolean;
}

/** Reads every page's boxes. Throws on files pdf-lib cannot parse at all. */
export async function analyzePdf(bytes: Uint8Array): Promise<PdfResult> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
  const pages: ArtworkPage[] = [];
  for (const [i, page] of doc.getPages().entries()) {
    const analyzed = await analyzePage(doc.context, page.node, i + 1);
    if (analyzed) pages.push(analyzed);
  }
  let title: string | null = null;
  if (!doc.isEncrypted) {
    try {
      title = doc.getTitle() ?? null;
    } catch {
      title = null;
    }
  }
  return { pages, title, encrypted: doc.isEncrypted };
}
