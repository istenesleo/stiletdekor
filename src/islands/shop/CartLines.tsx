// The cart's items, in the drawer and on the cart page: the product, its configuration in one line, the files, the
// gross price; on the cart page also the quantity, "Módosítás" and a warning about files the server may have deleted.
import { type CartEntry, expiredFiles } from '@/domain/cart';
import { MAX_QUANTITY, SHOP_PRODUCTS } from '@/domain/catalog';
import { describeConfiguration, tryPriceConfiguration } from '@/domain/pricing';
import { PRODUCT_KIND, productHref } from '@/site/shop-ui';
import { Badge } from '@/ui/Badge/Badge';
import { CartLine } from '@/ui/CartLine/CartLine';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';

export interface CartLinesProps {
  entries: readonly CartEntry[];
  onRemove?: (key: string) => void;
  /** Shows the quantity stepper (the cart page). */
  onQuantity?: (key: string, quantity: number) => void;
  /** Shows the "Módosítás" link (the cart page). */
  editable?: boolean;
  /** Messages from the order API, by item index. */
  errors?: Readonly<Record<number, string>>;
  now?: Date;
}

export function CartLines({ entries, onRemove, onQuantity, editable = false, errors = {}, now = new Date() }: CartLinesProps) {
  return (
    <ul className="shop-lines">
      {entries.map((entry, index) => {
        const priced = tryPriceConfiguration(entry.config);
        const spec = describeConfiguration(entry.config).split(' · ').slice(1).join(' · ');
        const files = entry.files.length > 0 ? `Grafika: ${entry.files.map((f) => f.name).join(', ')}` : 'Grafika: e-mailben küldi';
        const expired = expiredFiles(entry, now);
        const error = errors[index];
        return (
          <li key={entry.key} className="shop-lines__item">
            <CartLine
              title={SHOP_PRODUCTS[entry.config.productId].name}
              spec={
                <>
                  {spec}
                  <br />
                  {files}
                </>
              }
              price={priced.ok ? priced.price.grossTotal : 0}
              product={PRODUCT_KIND[entry.config.productId]}
              badges={entry.config.express ? <Badge tone="brand">Expressz</Badge> : undefined}
              onRemove={onRemove ? () => onRemove(entry.key) : undefined}
            />
            {(onQuantity || editable) && (
              <div className="shop-lines__tools">
                {onQuantity && (
                  <QuantityStepper value={entry.config.quantity} min={1} max={MAX_QUANTITY} onChange={(quantity) => onQuantity(entry.key, quantity)} />
                )}
                {editable && <a href={`${productHref(entry.config.productId)}#tetel=${entry.key}`}>Módosítás</a>}
              </div>
            )}
            {expired.length > 0 && (
              <p className="shop-lines__warn">
                Lejárt fájl: {expired.map((f) => f.name).join(', ')}. Töltse fel újra a Módosítás linkkel, vagy küldje el e-mailben a
                rendelés után.
              </p>
            )}
            {error && (
              <p className="shop-lines__error" role="alert">
                {error}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
