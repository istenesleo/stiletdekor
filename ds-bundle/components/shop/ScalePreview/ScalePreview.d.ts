import * as React from 'react';

/**
 * ScalePreview — from @stiletdekor/ui@0.1.0.
 */
export interface ScalePreviewProps {
  /** Product size in cm. */
  widthCm: number;
  heightCm: number;
  /** The uploaded artwork (an image URL); a placeholder without it. */
  imageUrl?: string;
  /** fill: covers the product, cropping the edges (default); fit: whole image visible, framed. */
  fit?: "fill" | "fit";
  /** Lifts the product off the floor, e.g. a sign above a door, in cm. */
  elevationCm?: number;
  /** A floor stand under the product (roll-up). */
  stand?: boolean;
  /** Holes or grommets on the product. */
  marks?: readonly ScaleMark[];
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const ScalePreview: React.ComponentType<ScalePreviewProps>;
