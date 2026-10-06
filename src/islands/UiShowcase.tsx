import { useState } from 'react';
import type { SiteThemeId } from '@/site/themes';
import { NavLink, SiteFooter, SiteHeader } from '@/ui';
import { BasicSpecs } from './showcase/BasicSpecs';
import { FormSpecs } from './showcase/FormSpecs';
import { QuoteNavSpecs } from './showcase/QuoteNavSpecs';
import { ShopSpecs } from './showcase/ShopSpecs';
import './UiShowcase.css';

interface ShowcaseProps {
  theme: SiteThemeId;
  themes: ReadonlyArray<{ id: SiteThemeId; label: string }>;
}

const GROUPS = [
  ['alapelemek', 'Alapelemek'],
  ['urlap', 'Űrlap'],
  ['webshop', 'Webshop és rendelés'],
  ['ajanlatkeres', 'Ajánlatkérés és navigáció'],
] as const;

/**
 * The UI library's specimen page: every component in its states, in the selected design direction. The page
 * itself uses the site header and footer, as a real page would.
 */
export default function UiShowcase({ theme, themes }: ShowcaseProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  return (
    <>
      <SiteHeader cartCount={2} onCartClick={openCart} />
      <main className="uis" id="tartalom">
        <div className="uis-top">
          <h1>Stilet UI · komponensek</h1>
          <nav className="uis-themes" aria-label="Design-irány">
            {themes.map((t) => (
              <NavLink key={t.id} href={`?tema=${t.id}`} current={t.id === theme}>
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <nav className="uis-toc" aria-label="Csoportok">
          {GROUPS.map(([id, label]) => (
            <NavLink key={id} href={`#${id}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <BasicSpecs />
        <FormSpecs />
        <ShopSpecs cartOpen={cartOpen} onCartOpenChange={setCartOpen} />
        <QuoteNavSpecs onCartClick={openCart} />
      </main>
      <SiteFooter />
    </>
  );
}
