import { Icon, ICON_NAMES } from '@stiletdekor/ui';

export const AllIcons = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: 'var(--space-2)' }}>
    {ICON_NAMES.map((name) => (
      <span
        key={name}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
      >
        <Icon name={name} style={{ color: 'var(--color-text)' }} />
        {name}
      </span>
    ))}
  </div>
);

export const SizesAndColors = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
    <Icon name="cart" size={16} />
    <Icon name="cart" />
    <Icon name="cart" size={32} />
    <Icon name="success" size={32} label="Kész" style={{ color: 'var(--color-signal-ok)' }} />
    <Icon name="warning" size={32} label="Figyelem" style={{ color: 'var(--color-signal-warn)' }} />
    <Icon name="pin" size={32} style={{ color: 'var(--color-brand)' }} />
  </div>
);
