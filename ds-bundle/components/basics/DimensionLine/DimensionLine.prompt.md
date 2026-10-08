DimensionLine from @stiletdekor/ui. Use via `window.StiletUI.DimensionLine` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The brand's measuring motif: a dimension line with arrowheads, end ticks and the size in millimetres.
Drawn in the measure color. Use it to show real sizes (previews, product tiles, illustrations), not as
decoration.
@category basics

## Props

```ts
interface DimensionLineProps {
  /** horizontal (default) fills the container's width; vertical fills its height. */
  orientation?: "horizontal" | "vertical";
  /** The measured length in millimetres, printed as "4 200 mm". */
  valueMm?: number;
  /** Text to print instead of valueMm (e.g. "85 cm"). */
  label?: string;
  /** Hide from screen readers when the same size is already stated in text nearby. */
  decorative?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Horizontal

```jsx
() => (
  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <DimensionLine valueMm={4200} />
    <div style={{ width: '60%' }}>
      <DimensionLine valueMm={850} />
    </div>
  </div>
)
```

### Vertical

```jsx
() => (
  <div style={{ display: 'flex', gap: 'var(--space-6)', height: 180 }}>
    <DimensionLine orientation="vertical" valueMm={2000} />
    <DimensionLine orientation="vertical" label="85 cm" />
  </div>
)
```

### AroundAProduct

```jsx
() => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', maxWidth: 360 }}>
    <div style={{ aspectRatio: '2 / 1', background: 'var(--color-surface-raised)', border: '1px solid var(--color-line)' }} />
    <DimensionLine orientation="vertical" valueMm={1000} />
    <DimensionLine valueMm={2000} />
  </div>
)
```
