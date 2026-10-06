// Result types of the artwork (print file) analysis.

export type ArtworkFormat = 'pdf' | 'ai' | 'eps' | 'svg' | 'png' | 'jpeg' | 'tiff' | 'psd' | 'webp' | 'gif' | 'unknown';

/** A physical size, always rounded to 0.1 mm. */
export interface SizeMm {
  readonly widthMm: number;
  readonly heightMm: number;
}

export type SizeSource = 'trimbox' | 'cropbox' | 'mediabox' | 'bbox' | 'svg-units' | 'dpi';
export type Rotation = 0 | 90 | 180 | 270;

export interface ArtworkPage {
  /** 1-based page or artboard number. */
  readonly index: number;
  /** Final product size: the PDF TrimBox if present, otherwise the visible page or bounding box. */
  readonly size: SizeMm;
  readonly sizeSource: SizeSource;
  /** What is physically printed, bleed included: the BleedBox if present, otherwise the visible page. */
  readonly printSize: SizeMm;
  /** Uniform bleed around the TrimBox when all four margins agree within 0.2 mm, otherwise null. */
  readonly bleedMm: number | null;
  /** Effective page rotation; already applied to size and printSize. */
  readonly rotation: Rotation;
  /** PDF only: equal keys mean visually identical pages (same geometry, drawing and images). */
  readonly contentKey: string | null;
}

export type ArtworkWarning =
  | { readonly code: 'raster-no-dpi' }
  | { readonly code: 'raster-default-dpi'; readonly dpi: number; readonly sizeIfTrusted: SizeMm }
  | { readonly code: 'svg-relative-units' }
  | { readonly code: 'pdf-encrypted' }
  | { readonly code: 'ai-without-pdf' }
  | { readonly code: 'unreadable'; readonly detail: string };

export interface ArtworkHints {
  /** Scale written in the file name or PDF title ("M1:10" → 10). 1 means an explicit 1:1. */
  readonly scale: number | null;
  /** Bleed mentioned in the file name or PDF title ("10 mm ráhagyással" → 10). */
  readonly bleedMmFromText: number | null;
  /** PDF document title, if any. */
  readonly title: string | null;
}

export interface ArtworkAnalysis {
  readonly format: ArtworkFormat;
  /** Empty when the file carries no reliable physical size. */
  readonly pages: readonly ArtworkPage[];
  readonly pixels: { readonly width: number; readonly height: number } | null;
  readonly dpi: { readonly x: number; readonly y: number } | null;
  /** exact: vector geometry; metadata: raster resolution; none: no reliable size. */
  readonly confidence: 'exact' | 'metadata' | 'none';
  readonly hints: ArtworkHints;
  readonly warnings: readonly ArtworkWarning[];
}
