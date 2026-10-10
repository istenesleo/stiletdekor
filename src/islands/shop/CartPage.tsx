// The cart page's island (/kosar, client:only="react"): the items with quantity, editing and removal, the gross total
// and the way to the checkout. The handover is chosen at the checkout.
import { formatHuf } from '@/domain/money';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { Notice } from '@/ui/Notice/Notice';
import { CHECKOUT_HREF, QUOTE_HREF, WEBSHOP_HREF } from '@/ui/navigation';
import { CartLines } from './CartLines';
import { useCart } from './cart-store';
import { cartTotals } from './price-rows';
import './shop.css';

export function CartPage() {
  const cart = useCart();
  if (!cart.ready) return null;
  const totals = cartTotals(cart.entries);
  return (
    <div className="shop-page">
      {cart.dropped > 0 && (
        <Notice tone="warning" live="polite">
          {cart.dropped === 1 ? 'Egy tétel' : `${cart.dropped} tétel`} már nem rendelhető így, ezért kikerült a kosárból.
        </Notice>
      )}
      {cart.entries.length === 0 ? (
        <div className="shop-page__empty">
          <p>A kosár üres.</p>
          <p>
            <a href={WEBSHOP_HREF}>Vissza a webshopba</a>, vagy egyedi munkához <a href={QUOTE_HREF}>kérjen ajánlatot</a>.
          </p>
        </div>
      ) : (
        <>
          <CartLines entries={cart.entries} onRemove={cart.remove} onQuantity={cart.setQuantity} editable />
          <div className="shop-page__summary">
            <p className="shop-page__total">
              <span>Összesen, bruttó</span>
              <strong>{formatHuf(totals.gross)}</strong>
            </p>
            <p className="shop-page__small">
              Nettó {formatHuf(totals.net)} + ÁFA {formatHuf(totals.vat)}. Az átvételt a pénztárban választja. {FINAL_PRICE_NOTICE}
            </p>
            <ButtonLink href={CHECKOUT_HREF} block>
              Tovább a pénztárba
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
