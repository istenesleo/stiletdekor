import type { ArtworkPage, SizeMm } from './types';
import { areaM2 } from './units';

export interface SurfaceGroup {
  /** Page numbers with identical size and content. */
  readonly pages: readonly number[];
  readonly size: SizeMm;
  readonly quantity: number;
  /** quantity × single area, rounded to 0.001 m². */
  readonly areaM2: number;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Groups identical surfaces of a multi-page file (e.g. window film per pane), first occurrence first. */
export function groupIdenticalSurfaces(pages: readonly ArtworkPage[]): SurfaceGroup[] {
  const groups: { pages: number[]; size: SizeMm }[] = [];
  const byKey = new Map<string, { pages: number[]; size: SizeMm }>();
  for (const page of pages) {
    const key = page.contentKey ? `${page.size.widthMm}x${page.size.heightMm}#${page.contentKey}` : null;
    const existing = key ? byKey.get(key) : undefined;
    if (existing) {
      existing.pages.push(page.index);
      continue;
    }
    const group = { pages: [page.index], size: page.size };
    groups.push(group);
    if (key) byKey.set(key, group);
  }
  return groups.map((g) => ({
    pages: g.pages,
    size: g.size,
    quantity: g.pages.length,
    areaM2: round3(g.pages.length * areaM2(g.size)),
  }));
}

/** Total area of all pages in m², rounded to 0.001. */
export function totalAreaM2(pages: readonly ArtworkPage[]): number {
  return round3(pages.reduce((sum, page) => sum + areaM2(page.size), 0));
}
