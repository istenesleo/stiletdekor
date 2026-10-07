import { Badge } from '@stiletdekor/ui';

export const Tones = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    <Badge>Webshop</Badge>
    <Badge tone="brand">Expressz</Badge>
    <Badge tone="placeholder">Helyőrző</Badge>
    <Badge tone="ok">Kiváló</Badge>
    <Badge tone="warn">Megfelelő</Badge>
    <Badge tone="bad">Gyenge</Badge>
  </div>
);

export const SolidAndDot = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    <Badge tone="brand" solid>
      −10%
    </Badge>
    <Badge tone="ok" dot>
      Nyomdakész
    </Badge>
    <Badge tone="warn" dot>
      Ellenőrzésre vár
    </Badge>
  </div>
);

export const OnAProduct = () => (
  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
    <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-display)', fontSize: 'var(--text-lg)' }}>
      Roll-up · teljes
    </strong>
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <Badge tone="brand">Expressz</Badge>
      <Badge>Online ár</Badge>
    </div>
  </div>
);
