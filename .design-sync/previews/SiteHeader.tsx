import { useState } from 'react';
import { SiteHeader } from '@stiletdekor/ui';

export const Desktop = () => {
  const [items, setItems] = useState(2);
  return <SiteHeader sticky={false} currentHref="/#webshop" cartCount={items} onCartClick={() => setItems((n) => n + 1)} />;
};

export const PhoneWithMenuOpen = () => (
  <div style={{ maxWidth: 390, minHeight: 600 }}>
    <SiteHeader sticky={false} skipTo={null} defaultMenuOpen cartCount={2} onCartClick={() => {}} />
  </div>
);
