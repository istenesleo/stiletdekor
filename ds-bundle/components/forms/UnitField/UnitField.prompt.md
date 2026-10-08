UnitField from @stiletdekor/ui. Use via `window.StiletUI.UnitField` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Number input with its unit inside the field: sizes in cm, quantities in db.
A text input with a decimal keyboard, so "29,7" can be typed; parse the value yourself (comma or dot).
@category forms

## Props

```ts
interface UnitFieldProps {
  label: React.ReactNode;
  /** Unit printed inside the field, e.g. "cm", "db", "mm". */
  unit: string;
  help?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### LetterHeight

```jsx
() => <UnitField label="Betűmagasság" unit="mm" defaultValue="350" help="A legmagasabb betű magassága." />
```

### WithError

```jsx
() => <UnitField label="Szélesség" unit="cm" defaultValue="620" error="Legfeljebb 500 cm lehet." />
```
