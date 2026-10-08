Badge from @stiletdekor/ui. Use via `window.StiletUI.Badge` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Short uppercase label for a status or a property of an item. Not interactive.
Examples: "Expressz", "Helyőrző", "Online ár".
@category basics

## Props

```ts
interface BadgeProps {
  /** neutral (default), brand ("Expressz"), ok / warn / bad (states), placeholder ("Helyőrző", dashed). */
  tone?: "neutral" | "brand" | "ok" | "warn" | "bad" | "placeholder";
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Tones

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    <Badge>Webshop</Badge>
    <Badge tone="brand">Expressz</Badge>
    <Badge tone="placeholder">Helyőrző</Badge>
    <Badge tone="ok">Kiváló</Badge>
    <Badge tone="warn">Megfelelő</Badge>
    <Badge tone="bad">Gyenge</Badge>
  </div>
)
```

### SolidAndDot

```jsx
() => (
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
)
```

### OnAProduct

```jsx
() => (
  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
    <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-display)', fontSize: 'var(--text-lg)' }}>
      Roll-up · teljes
    </strong>
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <Badge tone="brand">Expressz</Badge>
      <Badge>Online ár</Badge>
    </div>
  </div>
)
```
