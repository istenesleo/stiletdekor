import * as React from 'react';

/**
 * SizeFields — from @stiletdekor/ui@0.1.0.
 */
export interface SizeFieldsProps {
  /** Current width and height as typed (strings, so "29,7" and an empty field stay as they are). */
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  /** Swaps width and height (portrait ↔ landscape). The button is hidden without it. */
  onSwap?: () => void;
  /** Unit of both fields; "cm" by default. */
  unit?: string;
  /** Group caption, "Méret" by default. */
  legend?: string;
  /** Shows "A méret a fájlból": the sizes were read from the uploaded file. */
  fromFile?: boolean;
  /** Error for the pair, e.g. "A szélesség 10 és 500 cm között lehet.". */
  error?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const SizeFields: React.ComponentType<SizeFieldsProps>;
