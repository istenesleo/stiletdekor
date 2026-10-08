Field from @stiletdekor/ui. Use via `window.StiletUI.Field` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Label, control, help text and error in the library's layout, for wrapping a custom control.
TextField and the other inputs use it. To wrap your own control, get ids with useFieldIds and pass
describedBy(...) to the control.
@category forms

## Props

```ts
interface FieldProps {
  /** The control's label. */
  label: React.ReactNode;
  /** Id of the control the label belongs to. */
  htmlFor: string;
  /** Short hint under the control, e.g. "Erre a számra küldjük az egyeztetést.". */
  help?: React.ReactNode;
  /** Error under the control; shown in the error color with an icon. */
  error?: React.ReactNode;
  /** Adds the brand-colored "*" after the label (the control itself should be `required`). */
  required?: boolean;
  ids: FieldIds;
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### WrappingASelect

```jsx
() => {
  const ids = useFieldIds();
  const help = 'A futár díját a visszaigazolásban adjuk meg.';
  return (
    <Field label="Átvételi mód" htmlFor={ids.id} help={help} ids={ids}>
      <select id={ids.id} className="sd-input" aria-describedby={describedBy(ids, help)} defaultValue="futar">
        <option value="szemelyes">Személyes átvétel a műhelyben</option>
        <option value="futar">Futár</option>
        <option value="telepites">Telepítéssel</option>
      </select>
    </Field>
  );
}
```

### WithError

```jsx
() => {
  const ids = useFieldIds();
  const error = 'A rendelésszám így néz ki: R-2026-0087.';
  return (
    <Field label="Rendelésszám" htmlFor={ids.id} error={error} required ids={ids}>
      <input id={ids.id} className="sd-input" defaultValue="2026-87" required aria-invalid aria-describedby={describedBy(ids, undefined, error)} />
    </Field>
  );
}
```
