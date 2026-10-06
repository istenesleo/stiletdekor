// Physical size detection for uploaded print files (PDF, Illustrator, EPS, SVG, raster images).
export * from './types';
export { analyzeArtwork } from './analyze';
export { detectArtworkFormat } from './detect';
export { applyScale, areaM2, roundMm } from './units';
export { parseBleedHint, parseScaleHint, suggestScale } from './hints';
export { ISO_A_FORMATS, matchStandardFormat, type FormatMatch, type StandardFormat } from './formats';
export { groupIdenticalSurfaces, totalAreaM2, type SurfaceGroup } from './surfaces';
