SegmentedChoice from @stiletdekor/ui. Use via `window.StiletUI.SegmentedChoice` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Two to four mutually exclusive choices side by side, with optional descriptions.
E.g. the scale of a file (1:1, 1:10, egyéb), filling or fitting artwork. Stacks one per row when its
container is narrow.
@category forms

## Props

```ts
interface SegmentedChoiceProps {
  legend: string;
  options: readonly SegmentedOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### FileScale

```jsx
() => {
  const [scale, setScale] = useState('1');
  return (
    <SegmentedChoice
      legend="A fájl méretaránya"
      options={[
        { value: '1', label: '1:1', description: 'valós méret' },
        { value: '10', label: '1:10', description: 'tízszeresre nagyítjuk' },
        { value: 'x', label: 'Egyéb', description: 'megadom a méretet' },
      ]}
      value={scale}
      onChange={setScale}
    />
  );
}
```

### Compact

```jsx
() => {
  const [side, setSide] = useState('one');
  return (
    <SegmentedChoice
      legend="Nyomtatás"
      options={[
        { value: 'one', label: 'Egyoldalas' },
        { value: 'two', label: 'Kétoldalas' },
      ]}
      value={side}
      onChange={setSide}
    />
  );
}
```
