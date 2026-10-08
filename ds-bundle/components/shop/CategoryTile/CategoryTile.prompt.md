CategoryTile from @stiletdekor/ui. Use via `window.StiletUI.CategoryTile` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Product category tile with its from-price: a link on the home page, a selector in the webshop.
Shows e.g. "Molinó · 5 067 Ft/m²-től".
@category shop

## Props

```ts
interface CategoryTileProps {
  /** Product name, e.g. "Molinó". */
  name: string;
  /** Lowest gross price in forints ("-tól"). */
  price: number;
  /** m2: "Ft/m²-től"; db (default): "Ft-tól". */
  unit?: "m2" | "db";
  /** Pictogram; none when omitted. */
  product?: "molino" | "rollup" | "matrica" | "plakat" | "tabla" | "vaszon";
  /** Renders a link (to the product's configurator). */
  href?: string;
  /** As a selector inside the webshop (a button): the current product. */
  pressed?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** Extra button attributes when rendered as a button. */
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;
}
```

## Examples

### AsLinks

```jsx
() => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: 'var(--space-2)' }}>
    <CategoryTile product="molino" name="Molinó" price={5067} unit="m2" href="#molino" />
    <CategoryTile product="rollup" name="Roll-up" price={31623} href="#rollup" />
    <CategoryTile product="matrica" name="Matrica" price={8877} unit="m2" href="#matrica" />
    <CategoryTile product="plakat" name="Plakát" price={1257} href="#plakat" />
    <CategoryTile product="tabla" name="Tábla" price={12687} unit="m2" href="#tabla" />
    <CategoryTile product="vaszon" name="Vászonkép" price={10147} href="#vaszon" />
  </div>
)
```

### AsSelector

```jsx
() => {
  const [product, setProduct] = useState('molino');
  const tiles = [
    { product: 'molino' as const, name: 'Molinó', price: 5067, unit: 'm2' as const },
    { product: 'rollup' as const, name: 'Roll-up', price: 31623 },
    { product: 'tabla' as const, name: 'Tábla', price: 12687, unit: 'm2' as const },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: 'var(--space-2)' }}>
      {tiles.map((t) => (
        <CategoryTile key={t.product} {...t} pressed={t.product === product} onClick={() => setProduct(t.product)} />
      ))}
    </div>
  );
}
```
