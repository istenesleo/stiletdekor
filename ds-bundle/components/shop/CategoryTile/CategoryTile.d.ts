import * as React from 'react';

/**
 * CategoryTile — from @stiletdekor/ui@0.1.0.
 */
export interface CategoryTileProps {
  /** Product name, e.g. "Molinó". */
  name: string;
  /** Lowest gross price in forints ("-tól"). */
  price: number;
  /** m2: "Ft/m²-től"; db (default): "Ft-tól". */
  unit?: "m2" | "db";
  /** Pictogram; none when omitted. */
  product?: "molino" | "rollup" | "matrica" | "plakat" | "tabla" | "vaszon";
  /** Renders a link (to the product's configurator). */
  href?: string;
  /** As a selector inside the webshop (a button): the current product. */
  pressed?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** Extra button attributes when rendered as a button. */
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;
}

export declare const CategoryTile: React.ComponentType<CategoryTileProps>;
