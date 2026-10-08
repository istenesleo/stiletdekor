Icon from @stiletdekor/ui. Use via `window.StiletUI.Icon` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

A line icon from the Stilet set, drawn in the current text color. Decorative unless it gets a label.
24×24 grid; `size` sets it in px, otherwise it follows the font size.
@category basics

## Props

```ts
interface IconProps {
  /** Which icon to draw. */
  name: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  /** Size in px; by default the icon is 1.25× the surrounding font size. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  label?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### AllIcons

```jsx
() => (
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
)
```

### SizesAndColors

```jsx
() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
    <Icon name="cart" size={16} />
    <Icon name="cart" />
    <Icon name="cart" size={32} />
    <Icon name="success" size={32} label="Kész" style={{ color: 'var(--color-signal-ok)' }} />
    <Icon name="warning" size={32} label="Figyelem" style={{ color: 'var(--color-signal-warn)' }} />
    <Icon name="pin" size={32} style={{ color: 'var(--color-brand)' }} />
  </div>
)
```

## Related

`IconButton`
