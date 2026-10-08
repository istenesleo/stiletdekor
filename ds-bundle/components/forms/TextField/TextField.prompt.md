TextField from @stiletdekor/ui. Use via `window.StiletUI.TextField` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Labeled text input for name, e-mail, phone or address, or several lines with multiline.
Give it the right `type` and `autoComplete` (e.g. type="tel" autoComplete="tel") so phones offer the right
keyboard.
@category forms

## Props

```ts
interface TextFieldProps {
  label: React.ReactNode;
  help?: React.ReactNode;
  /** Error message; also marks the input invalid. */
  error?: React.ReactNode;
  /** Several lines (a textarea), e.g. "Megjegyzés", "Üzenet". */
  multiline?: boolean;
  /** Class for the wrapper (label + control + messages). */
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Required

```jsx
() => <TextField label="Név" autoComplete="name" required />
```

### WithHelp

```jsx
() => (
  <TextField label="Telefon" type="tel" autoComplete="tel" help="Erre a számra hívjuk vissza." defaultValue="+36 30 123 4567" />
)
```

### WithError

```jsx
() => (
  <TextField label="E-mail" type="email" autoComplete="email" required defaultValue="maria@" error="Adjon meg érvényes e-mail-címet." />
)
```

### Multiline

```jsx
() => <TextField label="Megjegyzés" multiline placeholder="pl. mikor érhető el telefonon" />
```

### Disabled

```jsx
() => <TextField label="Cégnév" disabled defaultValue="Minta Kft." />
```
