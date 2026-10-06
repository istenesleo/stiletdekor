import type { HTMLAttributes, ReactNode } from 'react';
import { formatHuf } from '@/domain/money';
import '../base.css';
import { PRODUCT_PICTOGRAMS, type ProductKind } from '../CategoryTile/pictograms';
import { cx } from '../cx';
import { IconButton } from '../IconButton/IconButton';
import './CartLine.css';

export interface CartLineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** "Molinó · Standard frontlit". */
  title: string;
  /** The configuration in one line: "200×100 cm · szegés + ringli · 2 db". */
  spec?: ReactNode;
  /** Gross line total in forints. */
  price: number;
  /** Thumbnail of the uploaded artwork. */
  thumbnailUrl?: string;
  /** Product pictogram when there is no thumbnail. */
  product?: ProductKind;
  /** Badges under the spec, e.g. <Badge tone="brand">Expressz</Badge>. */
  badges?: ReactNode;
  /** Shows a remove button. */
  onRemove?: () => void;
}

/** One item in the cart: thumbnail, what it is, its gross price, and a remove button. */
export function CartLine({ title, spec, price, thumbnailUrl, product, badges, onRemove, className, ...rest }: CartLineProps) {
  return (
    <div className={cx('sd-cartline', className)} {...rest}>
      <span className="sd-cartline__thumb" aria-hidden="true">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" />
        ) : product ? (
          <svg viewBox="0 0 48 36" dangerouslySetInnerHTML={{ __html: PRODUCT_PICTOGRAMS[product] }} />
        ) : null}
      </span>
      <div>
        <p className="sd-cartline__title">{title}</p>
        {spec && <p className="sd-cartline__spec">{spec}</p>}
        {badges && <div className="sd-cartline__badges">{badges}</div>}
      </div>
      <p className="sd-cartline__price">{formatHuf(price)}</p>
      {onRemove && (
        <IconButton className="sd-cartline__remove" icon="trash" size="sm" variant="plain" label={`Tétel törlése: ${title}`} onClick={onRemove} />
      )}
    </div>
  );
}
