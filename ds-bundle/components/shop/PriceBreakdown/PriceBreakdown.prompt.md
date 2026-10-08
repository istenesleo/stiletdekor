PriceBreakdown from @stiletdekor/ui. Use via `window.StiletUI.PriceBreakdown` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Itemised price: one row per component of the price, the gross total large, net and VAT small under it.
Every amount is gross (the site shows gross prices only).
@category shop

## Props

```ts
interface PriceBreakdownProps {
  rows: readonly PriceRow[];
  /** Gross total in forints. */
  total: number;
  /** "Kalkulált ár, bruttó" by default. */
  totalLabel?: string;
  /** Net amount and VAT for the small line under the total. */
  net?: number;
  vat?: number;
  /** Small print under the total, e.g. "A végleges ár eltérhet a kalkulált ártól.". */
  note?: React.ReactNode;
  /** Hidden table caption, "Tételes árbontás" by default. */
  caption?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Configurator

```jsx
() => (
  <PriceBreakdown
    rows={[
      { label: 'Anyag · Standard frontlit', detail: '2,00 m² × 5 067 Ft', amount: 10135 },
      { label: 'Szélkidolgozás · Szegés + ringli', detail: '6,00 fm × 445 Ft', amount: 2670 },
      { label: 'Egységár, 3 db', detail: '3 × 12 805 Ft', amount: 38415, kind: 'muted' },
      { label: 'Mennyiségi kedvezmény (−5%)', amount: -1921, kind: 'discount' },
      { label: 'Expressz (+30%)', amount: 10948 },
    ]}
    total={47442}
    net={37356}
    vat={10086}
    note="A végleges ár eltérhet a kalkulált ártól."
  />
)
```

### CartSummary

```jsx
() => (
  <PriceBreakdown
    caption="Kosár összesítő"
    rows={[
      { label: 'Termékek', amount: 68117 },
      { label: 'Átvétel', amountText: 'egyedi' },
    ]}
    totalLabel="Kalkulált végösszeg, bruttó"
    total={68117}
  />
)
```
