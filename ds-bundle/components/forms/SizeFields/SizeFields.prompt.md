SizeFields from @stiletdekor/ui. Use via `window.StiletUI.SizeFields` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Width and height fields with a swap button between them, as in the configurator.
@category forms

## Props

```ts
interface SizeFieldsProps {
  /** Current width and height as typed (strings, so "29,7" and an empty field stay as they are). */
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  /** Swaps width and height (portrait ↔ landscape). The button is hidden without it. */
  onSwap?: () => void;
  /** Unit of both fields; "cm" by default. */
  unit?: string;
  /** Group caption, "Méret" by default. */
  legend?: string;
  /** Shows "A méret a fájlból": the sizes were read from the uploaded file. */
  fromFile?: boolean;
  /** Error for the pair, e.g. "A szélesség 10 és 500 cm között lehet.". */
  error?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### FromFile

```jsx
() => {
  const [width, setWidth] = useState('200');
  const [height, setHeight] = useState('100');
  return (
    <SizeFields
      width={width}
      height={height}
      onWidthChange={setWidth}
      onHeightChange={setHeight}
      onSwap={() => {
        setWidth(height);
        setHeight(width);
      }}
      fromFile
    />
  );
}
```

### WithError

```jsx
() => (
  <SizeFields width="620" height="100" onWidthChange={() => {}} onHeightChange={() => {}} error="A szélesség legfeljebb 500 cm lehet." />
)
```
