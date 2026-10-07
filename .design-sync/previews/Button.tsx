import { Button } from '@stiletdekor/ui';

export const Variants = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button>Kosárba</Button>
    <Button variant="secondary">Mentés</Button>
    <Button variant="ghost">Mégsem</Button>
    <Button variant="link">Részletek</Button>
  </div>
);

export const WithIcons = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button icon="cart">Kosárba</Button>
    <Button variant="secondary" icon="arrow-right" iconPosition="end">
      Tovább
    </Button>
    <Button variant="ghost" size="sm" icon="upload">
      Fájl feltöltése
    </Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button disabled>Tiltott</Button>
    <Button loading>Küldés</Button>
    <Button variant="secondary" disabled>
      Tiltott
    </Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button size="sm">Kicsi</Button>
    <Button>Normál</Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 360 }}>
    <Button block icon="cart">
      Rendelés elküldése ellenőrzésre
    </Button>
  </div>
);
