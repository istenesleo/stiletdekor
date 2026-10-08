OptionRow from @stiletdekor/ui. Use via `window.StiletUI.OptionRow` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

A selectable option with its price preview: the unit rate and what it costs for the chosen size.
@category forms

## Props

```ts
interface OptionRowProps {
  /** radio (default) for one-of-many groups such as edge finish; checkbox for add-ons such as contour cut. */
  type?: "radio" | "checkbox";
  label: React.ReactNode;
  /** One line about what the option is, e.g. "Megerősített, szegett szél, ringli 50 cm-enként.". */
  description?: React.ReactNode;
  /** Gross unit price in forints, shown as "+445 Ft/fm". 0 shows "felár nélkül". */
  rate?: number;
  /** Unit of the rate: "fm", "m²", "db". */
  rateUnit?: string;
  /** Gross amount for the current size and quantity, in forints. */
  amount?: number;
  /** Text instead of an amount, e.g. "egyedi" (installation is priced at confirmation). */
  amountText?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### EdgeFinish

```jsx
() => {
  const [edge, setEdge] = useState('hem');
  const options = [
    { id: 'cut', label: 'Méretre vágás', description: 'Egyenesre vágott szél.', rate: 0, amount: 0 },
    { id: 'ringli', label: 'Ringli 50 cm-enként', description: 'Fém fűzőlyuk a szélen, kötözéshez.', rate: 254, amount: 1524 },
    { id: 'hem', label: 'Szegés + ringli', description: 'Megerősített, szegett szél, ringli 50 cm-enként.', rate: 445, amount: 2670 },
  ];
  return (
    <fieldset style={{ display: 'grid', gap: 'var(--space-2)', margin: 0, padding: 0, border: 0 }}>
      <legend className="sd-caps" style={{ marginBottom: 'var(--space-3)' }}>
        Szélkidolgozás
      </legend>
      {options.map((o) => (
        <OptionRow
          key={o.id}
          name="edge"
          value={o.id}
          label={o.label}
          description={o.description}
          rate={o.rate}
          rateUnit="fm"
          amount={o.amount}
          checked={edge === o.id}
          onChange={() => setEdge(o.id)}
        />
      ))}
    </fieldset>
  );
}
```

### AddOns

```jsx
() => {
  const [contour, setContour] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <OptionRow
        type="checkbox"
        label="Kontúrvágás"
        description="A grafika körvonala mentén vágjuk."
        rate={2540}
        rateUnit="m²"
        amount={635}
        checked={contour}
        onChange={(e) => setContour(e.target.checked)}
      />
      <OptionRow type="checkbox" label="Telepítés" description="A helyszínen felszereljük." amountText="egyedi" />
      <OptionRow type="checkbox" label="UV-laminálás" description="Most nem rendelhető." disabled />
    </div>
  );
}
```
