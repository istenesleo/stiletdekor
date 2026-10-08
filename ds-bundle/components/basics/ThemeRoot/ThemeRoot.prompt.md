ThemeRoot from @stiletdekor/ui. Use via `window.StiletUI.ThemeRoot` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Sets the design direction (theme) for everything inside it: token values, page background, body text.
Wrap a screen once. A ThemeRoot inside another one fully re-themes its part, so the two directions can be
compared side by side. The direction's web fonts must be loaded by the page (the site layout does it).
@category basics

## Props

```ts
interface ThemeRootProps {
  /** Design direction: "neon-muhely" (A, Neon műhely) or "galeria-editorial" (B, Galéria / editorial). */
  theme?: "neon-muhely" | "galeria-editorial";
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### NeonMuhely

```jsx
() => (
  <ThemeRoot theme="neon-muhely" style={{ padding: 'var(--space-5)' }}>
    <SectionHeader size="sm" eyebrow="A irány · Neon műhely" title="Rendelje meg online" lead="Az árat azonnal látja." />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
      <Button icon="cart">Kosárba</Button>
      <Badge tone="brand">Expressz</Badge>
    </div>
  </ThemeRoot>
)
```

### GaleriaEditorial

```jsx
() => (
  <ThemeRoot theme="galeria-editorial" style={{ padding: 'var(--space-5)' }}>
    <SectionHeader size="sm" eyebrow="B irány · Galéria" title="Rendelje meg online" lead="Az árat azonnal látja." />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
      <Button icon="cart">Kosárba</Button>
      <Badge tone="brand">Expressz</Badge>
    </div>
  </ThemeRoot>
)
```
