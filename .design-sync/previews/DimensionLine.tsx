import { DimensionLine } from '@stiletdekor/ui';

export const Horizontal = () => (
  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <DimensionLine valueMm={4200} />
    <div style={{ width: '60%' }}>
      <DimensionLine valueMm={850} />
    </div>
  </div>
);

export const Vertical = () => (
  <div style={{ display: 'flex', gap: 'var(--space-6)', height: 180 }}>
    <DimensionLine orientation="vertical" valueMm={2000} />
    <DimensionLine orientation="vertical" label="85 cm" />
  </div>
);

export const AroundAProduct = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', maxWidth: 360 }}>
    <div style={{ aspectRatio: '2 / 1', background: 'var(--color-surface-raised)', border: '1px solid var(--color-line)' }} />
    <DimensionLine orientation="vertical" valueMm={1000} />
    <DimensionLine valueMm={2000} />
  </div>
);
