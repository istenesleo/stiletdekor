import { Badge, Button, SectionHeader, ThemeRoot } from '@stiletdekor/ui';

export const NeonMuhely = () => (
  <ThemeRoot theme="neon-muhely" style={{ padding: 'var(--space-5)' }}>
    <SectionHeader size="sm" eyebrow="A irány · Neon műhely" title="Rendelje meg online" lead="Az árat azonnal látja." />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
      <Button icon="cart">Kosárba</Button>
      <Badge tone="brand">Expressz</Badge>
    </div>
  </ThemeRoot>
);

export const GaleriaEditorial = () => (
  <ThemeRoot theme="galeria-editorial" style={{ padding: 'var(--space-5)' }}>
    <SectionHeader size="sm" eyebrow="B irány · Galéria" title="Rendelje meg online" lead="Az árat azonnal látja." />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
      <Button icon="cart">Kosárba</Button>
      <Badge tone="brand">Expressz</Badge>
    </div>
  </ThemeRoot>
);
