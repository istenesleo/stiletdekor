IconButton from @stiletdekor/ui. Use via `window.StiletUI.IconButton` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Square button with a single icon: cart (with item count), menu, close, swap width and height.
@category basics

## Props

```ts
interface IconButtonProps {
  icon: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  /** Accessible name, e.g. "Kosár megnyitása, 2 tétel", "Menü", "Bezárás", "Szélesség és magasság cseréje". */
  label: string;
  /** Number shown in a brand-colored badge (the cart's item count). Hidden at 0. Include it in `label` too. */
  count?: number;
  /** outlined (default) or plain: no border until hovered. */
  variant?: "outlined" | "plain";
  /** md: 44 × 44 px (default); sm: 36 × 36 px. */
  size?: "sm" | "md";
  /** For toggles (e.g. a filter): renders aria-pressed. A button that opens a panel uses aria-expanded instead. */
  pressed?: boolean;
  /** The underlying button, e.g. to return focus to it. */
  ref?: React.Ref;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### CartWithCount

```jsx
() => (
  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
    <IconButton icon="cart" label="Kosár megnyitása, 0 tétel" count={0} />
    <IconButton icon="cart" label="Kosár megnyitása, 3 tétel" count={3} />
    <IconButton icon="cart" label="Kosár megnyitása, 120 tétel" count={120} />
  </div>
)
```

### Actions

```jsx
() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    <IconButton icon="menu" label="Menü" />
    <IconButton icon="close" label="Bezárás" variant="plain" />
    <IconButton icon="swap" label="Szélesség és magasság cseréje" size="sm" />
    <IconButton icon="trash" label="Tétel törlése" size="sm" variant="plain" />
  </div>
)
```

### States

```jsx
() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    <IconButton icon="pin" label="Csak a műhely közelében" pressed />
    <IconButton icon="trash" label="Tétel törlése" disabled />
  </div>
)
```
