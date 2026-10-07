import type { ButtonHTMLAttributes, MouseEventHandler } from 'react';
import { formatHuf } from '@/domain/money';
import '../base.css';
import { cx } from '../cx';
import './CategoryTile.css';
import { PRODUCT_PICTOGRAMS, type ProductKind } from './pictograms';

export interface CategoryTileProps {
  /** Product name, e.g. "Molinó". */
  name: string;
  /** Lowest gross price in forints ("-tól"). */
  price: number;
  /** m2: "Ft/m²-től"; db (default): "Ft-tól". */
  unit?: 'm2' | 'db';
  /** Pictogram; none when omitted. */
  product?: ProductKind;
  /** Renders a link (to the product's configurator). */
  href?: string;
  /** As a selector inside the webshop (a button): the current product. */
  pressed?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** Extra button attributes when rendered as a button. */
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'>;
}

/**
 * Product category tile with its from-price: a link on the home page, a selector in the webshop.
 * Shows e.g. "Molinó · 5 067 Ft/m²-től".
 * @category shop
 */
export function CategoryTile({ name, price, unit = 'db', product, href, pressed, onClick, className, buttonProps }: CategoryTileProps) {
  const body = (
    <>
      {product && (
        <svg className="sd-cat__pict" viewBox="0 0 48 36" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PRODUCT_PICTOGRAMS[product] }} />
      )}
      <span className="sd-cat__name">{name}</span>{' '}
      <span className="sd-cat__price">
        {formatHuf(price)}
        {unit === 'm2' ? '/m²-től' : '-tól'}
      </span>
    </>
  );
  if (href) {
    return (
      <a className={cx('sd-cat', className)} href={href} onClick={onClick}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" className={cx('sd-cat', className)} aria-pressed={pressed} onClick={onClick} {...buttonProps}>
      {body}
    </button>
  );
}

export type { ProductKind };
