Switch from @stiletdekor/ui. Use via `window.StiletUI.Switch` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

On/off switch for an option that changes the result immediately, e.g. express production.
Label example: "Expressz (+30%)".
@category forms

## Props

```ts
interface SwitchProps {
  /** What the switch turns on, e.g. "Expressz gyártás". */
  label: React.ReactNode;
  /** The consequence, e.g. "1 munkanap, +30%". */
  description?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Express

```jsx
() => {
  const [express, setExpress] = useState(true);
  return (
    <Switch label="Expressz gyártás" description="1 munkanap, +30%" checked={express} onChange={(e) => setExpress(e.target.checked)} />
  );
}
```

### Disabled

```jsx
() => <Switch label="Telepítés" description="Csak Budapesten és Pest megyében." disabled />
```
