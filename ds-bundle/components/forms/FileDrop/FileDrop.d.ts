import * as React from 'react';

/**
 * FileDrop — from @stiletdekor/ui@0.1.0.
 */
export interface FileDropProps {
  /** Called with the chosen or dropped files. Check type and size yourself. */
  onFiles: (files: File[]) => void;
  /** File input `accept`, e.g. ".pdf,.ai,.eps,.svg,.tif,.tiff,.psd,.jpg,.jpeg,.png". */
  accept?: string;
  multiple?: boolean;
  /** Main line, "Húzza ide a grafikát" by default. */
  title?: React.ReactNode;
  /** Formats and limits, e.g. "PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB". */
  hint?: React.ReactNode;
  /** Button text, "Fájl kiválasztása" by default. */
  buttonLabel?: string;
  /** Upload progress 0–100: shows a progress bar instead of the button. */
  progress?: number;
  /** Error message, e.g. "Ezt a fájltípust nem tudjuk feldolgozni.". */
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export declare const FileDrop: React.ComponentType<FileDropProps>;
