Button from @stiletdekor/ui. Use via `window.StiletUI.Button` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Button for an action: one primary per view, secondary or ghost for the rest.
E.g. "Kosárba", "Rendelés elküldése ellenőrzésre". Use ButtonLink when the action navigates.
@category basics

## Props

```ts
interface ButtonProps {
  /** Shows a spinner, keeps the width, ignores clicks and tells assistive tech that work is in progress. */
  loading?: boolean;
  /** primary: brand color, the one main action of a view; secondary and ghost: other actions; link: text-like. */
  variant?: "primary" | "secondary" | "ghost" | "link";
  /** md: 44 px tall (default); sm: 36 px. */
  size?: "sm" | "md";
  /** Icon before or after the label. */
  icon?: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  iconPosition?: "start" | "end";
  /** Stretch to the full width of the container. */
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Variants

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button>Kosárba</Button>
    <Button variant="secondary">Mentés</Button>
    <Button variant="ghost">Mégsem</Button>
    <Button variant="link">Részletek</Button>
  </div>
)
```

### WithIcons

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button icon="cart">Kosárba</Button>
    <Button variant="secondary" icon="arrow-right" iconPosition="end">
      Tovább
    </Button>
    <Button variant="ghost" size="sm" icon="upload">
      Fájl feltöltése
    </Button>
  </div>
)
```

### States

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button disabled>Tiltott</Button>
    <Button loading>Küldés</Button>
    <Button variant="secondary" disabled>
      Tiltott
    </Button>
  </div>
)
```

### Sizes

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <Button size="sm">Kicsi</Button>
    <Button>Normál</Button>
  </div>
)
```

### FullWidth

```jsx
() => (
  <div style={{ maxWidth: 360 }}>
    <Button block icon="cart">
      Rendelés elküldése ellenőrzésre
    </Button>
  </div>
)
```

## Related

`ButtonLink`
