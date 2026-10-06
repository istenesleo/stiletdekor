import type { ArtworkPage } from './types';
import { latin1, MM_PER_PT, toSize } from './units';

const SCAN_BYTES = 65536;

/** The PostScript part of an EPS: DOS binary EPS files wrap it after a 30-byte header. */
export function postScriptSection(bytes: Uint8Array): Uint8Array {
  const isDosEps = bytes[0] === 0xc5 && bytes[1] === 0xd0 && bytes[2] === 0xd3 && bytes[3] === 0xc6;
  if (!isDosEps || bytes.length < 12) return bytes;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = view.getUint32(4, true);
  const length = view.getUint32(8, true);
  if (length === 0 || offset + length > bytes.length) throw new Error('Invalid DOS EPS header');
  return bytes.subarray(offset, offset + length);
}

const NUM = String.raw`(-?(?:\d+(?:\.\d*)?|\.\d+))`;

function findBox(text: string, key: 'HiResBoundingBox' | 'BoundingBox', last: boolean): number[] | 'atend' | null {
  const re = new RegExp(String.raw`(?:^|[\r\n])%%${key}:[ \t]*(?:(\(atend\))|${NUM}[ \t]+${NUM}[ \t]+${NUM}[ \t]+${NUM})`, 'g');
  let found: RegExpExecArray | null = null;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    found = m;
    if (!last) break;
  }
  if (!found) return null;
  if (found[1]) return 'atend';
  return [found[2], found[3], found[4], found[5]].map(Number);
}

/** EPS (and PostScript) bounding box as one page; empty when no usable box is declared. */
export function epsPages(bytes: Uint8Array): ArtworkPage[] {
  const ps = postScriptSection(bytes);
  const head = latin1(ps.subarray(0, SCAN_BYTES));
  let box: number[] | null = null;
  for (const key of ['HiResBoundingBox', 'BoundingBox'] as const) {
    const found = findBox(head, key, false);
    if (found === 'atend') {
      const atEnd = findBox(latin1(ps.subarray(Math.max(0, ps.length - SCAN_BYTES))), key, true);
      if (Array.isArray(atEnd)) {
        box = atEnd;
        break;
      }
    } else if (found) {
      box = found;
      break;
    }
  }
  if (!box) return [];
  const [llx = 0, lly = 0, urx = 0, ury = 0] = box;
  const width = Math.abs(urx - llx) * MM_PER_PT;
  const height = Math.abs(ury - lly) * MM_PER_PT;
  if (!(width > 0 && height > 0)) return [];
  const size = toSize(width, height);
  return [{ index: 1, size, sizeSource: 'bbox', printSize: size, bleedMm: null, rotation: 0, contentKey: null }];
}
