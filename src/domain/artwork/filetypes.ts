import type { ArtworkFormat } from './types';

/**
 * What the size detection reads from a file type. exact: the vector page or bounding box; resolution: pixels
 * divided by the resolution written in the file; pixels: pixel size only (enough for the DPI check); none.
 */
export type SizeReading = 'exact' | 'resolution' | 'pixels' | 'none';

export interface ArtworkFileType {
  readonly format: Exclude<ArtworkFormat, 'unknown'>;
  readonly label: string;
  readonly extensions: readonly string[];
  readonly sizeReading: SizeReading;
}

/** Print files the upload accepts, in the order the upload form lists them. */
export const ARTWORK_FILE_TYPES: readonly ArtworkFileType[] = [
  { format: 'pdf', label: 'PDF', extensions: ['pdf'], sizeReading: 'exact' },
  // Exact when saved with PDF compatibility (Illustrator's default); otherwise no size.
  { format: 'ai', label: 'Adobe Illustrator', extensions: ['ai'], sizeReading: 'exact' },
  { format: 'eps', label: 'EPS', extensions: ['eps'], sizeReading: 'exact' },
  { format: 'svg', label: 'SVG', extensions: ['svg'], sizeReading: 'exact' },
  { format: 'tiff', label: 'TIFF', extensions: ['tif', 'tiff'], sizeReading: 'resolution' },
  { format: 'psd', label: 'Adobe Photoshop', extensions: ['psd', 'psb'], sizeReading: 'resolution' },
  { format: 'jpeg', label: 'JPG', extensions: ['jpg', 'jpeg', 'jpe', 'jfif'], sizeReading: 'resolution' },
  { format: 'png', label: 'PNG', extensions: ['png'], sizeReading: 'resolution' },
  { format: 'bmp', label: 'BMP', extensions: ['bmp'], sizeReading: 'resolution' },
  { format: 'heic', label: 'HEIC (iPhone-fotó)', extensions: ['heic', 'heif'], sizeReading: 'pixels' },
  { format: 'avif', label: 'AVIF', extensions: ['avif'], sizeReading: 'pixels' },
  { format: 'webp', label: 'WebP', extensions: ['webp'], sizeReading: 'pixels' },
  { format: 'gif', label: 'GIF', extensions: ['gif'], sizeReading: 'pixels' },
  { format: 'cdr', label: 'CorelDRAW', extensions: ['cdr'], sizeReading: 'none' },
];

/** Value for `<input type="file" accept="…">`. */
export const ARTWORK_ACCEPT = ARTWORK_FILE_TYPES.flatMap((type) => type.extensions.map((ext) => `.${ext}`)).join(',');

/** The accepted file type for a file name's extension, or undefined. The content is checked separately. */
export function artworkFileTypeOf(fileName: string): ArtworkFileType | undefined {
  const ext = /\.([a-z0-9]+)$/i.exec(fileName.trim())?.[1]?.toLowerCase();
  return ext === undefined ? undefined : ARTWORK_FILE_TYPES.find((type) => type.extensions.includes(ext));
}
