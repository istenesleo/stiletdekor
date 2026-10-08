Divider from @stiletdekor/ui. Use via `window.StiletUI.Divider` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Hairline that separates groups of content, optionally with a label naming the group that follows.
@category basics

## Props

```ts
interface DividerProps {
  /** Small uppercase caption at the start of the line, e.g. "Átvétel". Without it a plain hairline. */
  label?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Plain

```jsx
() => (
  <div>
    <p style={{ margin: 0 }}>Molinó, 200×100 cm</p>
    <Divider />
    <p style={{ margin: 0 }}>Roll-up, 85×200 cm</p>
  </div>
)
```

### WithLabel

```jsx
() => (
  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
    <Divider label="Átvétel" />
    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Személyes átvétel a műhelyben, Budapest.</p>
  </div>
)
```
