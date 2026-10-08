SurfaceList from @stiletdekor/ui. Use via `window.StiletUI.SurfaceList` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The surfaces of a multi-page PDF (a surface package, e.g. window film per window).
Identical pages are merged into one surface with a count, each one is skippable, and a set count applies to
the whole package.
@category shop

## Props

```ts
interface SurfaceListProps {
  surfaces: readonly Surface[];
  /** Number of sets (e.g. one per shop window). */
  sets: number;
  onSetsChange: (sets: number) => void;
  /** Leaves a surface out of the order, or takes it back. */
  onToggleSkip?: (id: string) => void;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### WindowFilmPackage

```jsx
() => {
  const [sets, setSets] = useState(2);
  const [surfaces, setSurfaces] = useState([
    { id: 'a', label: 'Bejárati ajtó', pages: [1, 3], widthMm: 900, heightMm: 2100, count: 2 },
    { id: 'b', label: 'Kirakat, bal', pages: [2], widthMm: 2400, heightMm: 1800, count: 1 },
    { id: 'c', label: 'Kirakat, jobb', pages: [4], widthMm: 2400, heightMm: 1800, count: 1 },
    { id: 'd', label: 'Nyitvatartás-matrica', pages: [5], widthMm: 300, heightMm: 400, count: 1, skipped: true },
  ]);
  return (
    <SurfaceList
      surfaces={surfaces}
      sets={sets}
      onSetsChange={setSets}
      onToggleSkip={(id) => setSurfaces((list) => list.map((s) => (s.id === id ? { ...s, skipped: !s.skipped } : s)))}
    />
  );
}
```
