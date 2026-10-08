import * as React from 'react';

/**
 * CartLine — from @stiletdekor/ui@0.1.0.
 */
export interface CartLineProps {
  /** "Molinó · Standard frontlit". */
  title: string;
  /** The configuration in one line: "200×100 cm · szegés + ringli · 2 db". */
  spec?: React.ReactNode;
  /** Gross line total in forints. */
  price: number;
  /** Thumbnail of the uploaded artwork. */
  thumbnailUrl?: string;
  /** Product pictogram when there is no thumbnail. */
  product?: "molino" | "rollup" | "matrica" | "plakat" | "tabla" | "vaszon";
  /** Badges under the spec, e.g. <Badge tone="brand">Expressz</Badge>. */
  badges?: React.ReactNode;
  /** Shows a remove button. */
  onRemove?: () => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const CartLine: React.ComponentType<CartLineProps>;
