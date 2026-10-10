// The cart drawer the configurator opens after "Kosárba": the items, the gross total and the way on.
import { formatHuf } from '@/domain/money';
import { Button } from '@/ui/Button/Button';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { Drawer } from '@/ui/Drawer/Drawer';
import { CART_HREF, CHECKOUT_HREF } from '@/ui/navigation';
import type { CartApi } from './cart-store';
import { CartLines } from './CartLines';
import { cartTotals } from './price-rows';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartApi;
}

export function CartDrawer({ open, onClose, cart }: CartDrawerProps) {
  const totals = cartTotals(cart.entries);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Kosár"
      footer={
        <div className="shop-drawer__foot">
          <p className="shop-drawer__total">
            <span>Összesen, bruttó</span>
            <strong>{formatHuf(totals.gross)}</strong>
          </p>
          <ButtonLink href={CHECKOUT_HREF} block>
            Tovább a pénztárba
          </ButtonLink>
          <Button variant="secondary" block onClick={onClose}>
            Vásárlás folytatása
          </Button>
          <a href={CART_HREF}>A kosár megtekintése</a>
        </div>
      }
    >
      {cart.entries.length > 0 ? <CartLines entries={cart.entries} onRemove={cart.remove} /> : <p>A kosár üres.</p>}
    </Drawer>
  );
}
