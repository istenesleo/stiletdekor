import { NavLink } from '@stiletdekor/ui';

export const MainMenu = () => (
  <nav aria-label="Főmenü" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
    <NavLink href="#szolgaltatasok">Szolgáltatások</NavLink>
    <NavLink href="#webshop" current>
      Webshop
    </NavLink>
    <NavLink href="#referenciak">Referenciák</NavLink>
    <NavLink href="#kapcsolat">Kapcsolat</NavLink>
  </nav>
);
