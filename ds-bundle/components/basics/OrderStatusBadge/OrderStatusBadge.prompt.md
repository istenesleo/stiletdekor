OrderStatusBadge from @stiletdekor/ui. Use via `window.StiletUI.OrderStatusBadge` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The status of an order as a badge with its customer-facing label.
E.g. "Gyártás alatt", "Visszaigazolva, befizetésre vár".
@category basics

## Props

```ts
interface OrderStatusBadgeProps {
  status: "beerkezett" | "modositas" | "visszaigazolva" | "gyartas" | "elkeszult" | "teljesitve" | "elutasitva" | "lemondva" | "lejart";
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
}
```

## Examples

### AllStatuses

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    {(Object.keys(ORDER_STATUS_TONES) as Array<keyof typeof ORDER_STATUS_TONES>).map((status) => (
      <OrderStatusBadge key={status} status={status} />
    ))}
  </div>
)
```

### InAnOrderList

```jsx
() => (
  <ul style={{ display: 'grid', gap: 'var(--space-3)', margin: 0, padding: 0, listStyle: 'none' }}>
    {[
      { ref: 'R-2026-0087', item: 'Molinó, 200×100 cm', status: 'gyartas' as const },
      { ref: 'R-2026-0081', item: 'Roll-up, 85×200 cm', status: 'visszaigazolva' as const },
      { ref: 'R-2026-0074', item: 'Dibond tábla, 60×40 cm', status: 'teljesitve' as const },
    ].map((order) => (
      <li key={order.ref} style={{ display: 'grid', justifyItems: 'start', gap: 'var(--space-1)' }}>
        <span>
          <b style={{ fontFamily: 'var(--font-mono)' }}>{order.ref}</b> · {order.item}
        </span>
        <OrderStatusBadge status={order.status} />
      </li>
    ))}
  </ul>
)
```
