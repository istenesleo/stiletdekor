QuantityStepper from @stiletdekor/ui. Use via `window.StiletUI.QuantityStepper` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Quantity with minus and plus buttons and a field for typing.
Arrow keys step by one; the value is clamped to min…max when the field loses focus.
@category forms

## Props

```ts
interface QuantityStepperProps {
  /** Current quantity. */
  value: number;
  onChange: (value: number) => void;
  /** Smallest allowed quantity, 1 by default. */
  min?: number;
  /** Largest allowed quantity. */
  max?: number;
  /** Label above the control, "Darabszám" by default. */
  label?: React.ReactNode;
  /** E.g. "2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%". */
  help?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}
```

## Examples

### WithDiscountHelp

```jsx
() => {
  const [qty, setQty] = useState(2);
  return <QuantityStepper value={qty} onChange={setQty} help="2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%" />;
}
```

### AtTheLimit

```jsx
() => {
  const [qty, setQty] = useState(1);
  return <QuantityStepper label="Készletek száma" value={qty} onChange={setQty} min={1} max={20} />;
}
```

### Disabled

```jsx
() => <QuantityStepper value={1} onChange={() => {}} disabled />
```
