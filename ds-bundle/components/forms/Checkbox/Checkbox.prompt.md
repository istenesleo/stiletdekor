Checkbox from @stiletdekor/ui. Use via `window.StiletUI.Checkbox` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Checkbox with a label and an optional description, e.g. for accepting the terms.
E.g. "Helyszíni felmérést kérek".
@category forms

## Props

```ts
interface CheckboxProps {
  /** The statement the visitor agrees to or chooses; may contain a link ("Elfogadom az ÁSZF-et"). */
  label: React.ReactNode;
  /** A second, quieter line under the label. */
  description?: React.ReactNode;
  /** Error under the checkbox, e.g. "Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.". */
  error?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### WithDescription

```jsx
() => (
  <Checkbox
    label="Helyszíni felmérést kérek"
    description="Kimegyünk, lemérjük a felületet, és utána küldjük a pontos ajánlatot."
    defaultChecked
  />
)
```

### RequiredWithError

```jsx
() => (
  <Checkbox label="Elfogadom az ÁSZF-et" required error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés." />
)
```

### Disabled

```jsx
() => <Checkbox label="Hírlevelet kérek" disabled />
```
