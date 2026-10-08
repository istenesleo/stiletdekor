FitPicker from @stiletdekor/ui. Use via `window.StiletUI.FitPicker` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Fill (crop) or fit (frame) when the artwork's aspect ratio differs from the product's.
@category forms

## Props

```ts
interface FitPickerProps {
  value: "fill" | "fit";
  onChange: (value: FitMode) => void;
  /** "Ha a kép aránya eltér" by default. */
  legend?: string;
  children?: React.ReactNode;
  name?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### FillOrFit

```jsx
() => {
  const [fit, setFit] = useState<'fill' | 'fit'>('fill');
  return <FitPicker value={fit} onChange={setFit} />;
}
```
