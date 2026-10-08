ChipGroup from @stiletdekor/ui. Use via `window.StiletUI.ChipGroup` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

One-click choices as chips, one selectable at a time: common sizes (size presets), filters.
@category forms

## Props

```ts
interface ChipGroupProps {
  /** Caption of the group, e.g. "Gyakori méretek". */
  legend: string;
  options: readonly ChipOption[];
  /** The selected option's value; none selected when it matches no option (e.g. a custom size). */
  value?: string;
  onChange: (value: string) => void;
  /** Radio group name; generated when omitted. */
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### SizePresets

```jsx
() => {
  const [size, setSize] = useState('200x100');
  return (
    <ChipGroup
      legend="Gyakori méretek (cm)"
      options={[
        { value: '100x50', label: '100×50' },
        { value: '200x100', label: '200×100' },
        { value: '300x100', label: '300×100' },
        { value: '400x200', label: '400×200' },
        { value: '500x100', label: '500×100' },
      ]}
      value={size}
      onChange={setSize}
    />
  );
}
```
