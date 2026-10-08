CartLine from @stiletdekor/ui. Use via `window.StiletUI.CartLine` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

One item in the cart: thumbnail, what it is, its gross price, and a remove button.
@category shop

## Props

```ts
interface CartLineProps {
  /** "Molinó · Standard frontlit". */
  title: string;
  /** The configuration in one line: "200×100 cm · szegés + ringli · 2 db". */
  spec?: React.ReactNode;
  /** Gross line total in forints. */
  price: number;
  /** Thumbnail of the uploaded artwork. */
  thumbnailUrl?: string;
  /** Product pictogram when there is no thumbnail. */
  product?: "molino" | "rollup" | "matrica" | "plakat" | "tabla" | "vaszon";
  /** Badges under the spec, e.g. <Badge tone="brand">Expressz</Badge>. */
  badges?: React.ReactNode;
  /** Shows a remove button. */
  onRemove?: () => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### WithArtwork

```jsx
() => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><rect y="150" width="400" height="50" fill="#f2c230"/><text x="28" y="100" font-family="Arial" font-size="56" font-weight="700" fill="#fff">NYITÁS</text></svg>',
    );
  return <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 3 db" price={36494} thumbnailUrl={artwork} onRemove={() => {}} />;
}
```

### WithPictogramAndBadge

```jsx
() => (
  <CartLine
    title="Roll-up · teljes"
    spec="85×200 cm · táskával · 1 db"
    price={31623}
    product="rollup"
    badges={<Badge tone="brand">Expressz</Badge>}
    onRemove={() => {}}
  />
)
```

### ReadOnly

```jsx
() => <CartLine title="Matrica · monomer" spec="50×30 cm · kontúrvágással · 10 db" price={8877} product="matrica" />
```
