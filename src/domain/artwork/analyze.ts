import { detectArtworkFormat, isPdfBytes } from './detect';
import { epsPages } from './eps';
import { parseBleedHint, parseScaleHint } from './hints';
import { analyzePdf } from './pdf';
import { RASTER_FORMATS, rasterPages, readRaster } from './raster';
import { svgPages } from './svg';
import type { ArtworkAnalysis, ArtworkPage, ArtworkWarning } from './types';

/**
 * Reads the physical size of a print file. Never throws: an unreadable file gives no pages and an
 * 'unreadable' warning. Vector formats give exact sizes; raster images only when they carry a
 * non-default resolution.
 */
export async function analyzeArtwork(bytes: Uint8Array, fileName = ''): Promise<ArtworkAnalysis> {
  const format = detectArtworkFormat(bytes, fileName);
  let pages: ArtworkPage[] = [];
  const warnings: ArtworkWarning[] = [];
  let pixels: ArtworkAnalysis['pixels'] = null;
  let dpi: ArtworkAnalysis['dpi'] = null;
  let title: string | null = null;
  let vector = false;
  try {
    if ((format === 'pdf' || format === 'ai') && isPdfBytes(bytes)) {
      vector = true;
      const pdf = await analyzePdf(bytes);
      pages = pdf.pages;
      title = pdf.title;
      if (pdf.encrypted) warnings.push({ code: 'pdf-encrypted' });
      if (pages.length === 0) warnings.push({ code: 'unreadable', detail: 'No readable page' });
    } else if (format === 'ai') {
      // A PostScript-only Illustrator file: its bounding box is the artwork, not the artboard, so no size.
      warnings.push({ code: 'ai-without-pdf' });
    } else if (format === 'eps') {
      vector = true;
      pages = epsPages(bytes);
    } else if (format === 'svg') {
      vector = true;
      const svg = svgPages(bytes);
      pages = svg.pages;
      if (svg.relativeUnits) warnings.push({ code: 'svg-relative-units' });
    } else if (RASTER_FORMATS.has(format)) {
      const info = readRaster(bytes, format);
      pixels = { width: info.width, height: info.height };
      const raster = rasterPages(info);
      pages = raster.pages;
      dpi = raster.dpi;
      warnings.push(...raster.warnings);
    }
  } catch (error) {
    pages = [];
    warnings.push({ code: 'unreadable', detail: error instanceof Error ? error.message : String(error) });
  }
  const hints = {
    scale: parseScaleHint(fileName) ?? (title ? parseScaleHint(title) : null),
    bleedMmFromText: parseBleedHint(fileName) ?? (title ? parseBleedHint(title) : null),
    title,
  };
  const confidence = pages.length === 0 ? 'none' : vector ? 'exact' : 'metadata';
  return { format, pages, pixels, dpi, confidence, hints, warnings };
}
