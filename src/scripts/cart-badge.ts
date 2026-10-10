// The header's cart count on every page: reads the stored cart's item count (without the cart's schema, so this
// stays tiny) and follows changes from this tab (CART_CHANGED_EVENT) and the others (storage).
import { CART_CHANGED_EVENT, CART_STORAGE_KEY, cartItemCount } from '@/domain/cart-count';

export function initCartBadge(root: ParentNode = document): void {
  const update = () => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      // No storage: no count.
    }
    const count = cartItemCount(raw);
    for (const link of root.querySelectorAll<HTMLElement>('[data-cart-link]')) {
      link.setAttribute('aria-label', count > 0 ? `Kosár, ${count} tétel` : 'Kosár');
      const badge = link.querySelector<HTMLElement>('[data-cart-count]');
      if (badge) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = count === 0;
      }
    }
  };
  update();
  window.addEventListener(CART_CHANGED_EVENT, update);
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === CART_STORAGE_KEY) update();
  });
}
