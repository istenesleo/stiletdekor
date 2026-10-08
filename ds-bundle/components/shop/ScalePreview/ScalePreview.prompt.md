ScalePreview from @stiletdekor/ui. Use via `window.StiletUI.ScalePreview` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The product at real scale next to a 180 cm figure, with dimension lines in millimetres.
Shows the artwork in the chosen fit. Redraws to its container's size; keep it at least ~280 px wide.
@category shop

## Props

```ts
interface ScalePreviewProps {
  /** Product size in cm. */
  widthCm: number;
  heightCm: number;
  /** The uploaded artwork (an image URL); a placeholder without it. */
  imageUrl?: string;
  /** fill: covers the product, cropping the edges (default); fit: whole image visible, framed. */
  fit?: "fill" | "fit";
  /** Lifts the product off the floor, e.g. a sign above a door, in cm. */
  elevationCm?: number;
  /** A floor stand under the product (roll-up). */
  stand?: boolean;
  /** Holes or grommets on the product. */
  marks?: readonly ScaleMark[];
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Banner

```jsx
() => <ScalePreview widthCm={200} heightCm={100} />
```

### RollUpWithArtwork

```jsx
() => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><rect y="150" width="400" height="50" fill="#f2c230"/><circle cx="330" cy="70" r="38" fill="#f2c230"/><text x="28" y="100" font-family="Arial" font-size="52" font-weight="700" fill="#fff">NYITÁS</text></svg>',
    );
  return <ScalePreview widthCm={85} heightCm={200} stand imageUrl={artwork} />;
}
```

### BoardWithHoles

```jsx
() => (
  <ScalePreview
    widthCm={60}
    heightCm={40}
    elevationCm={110}
    marks={[
      { x: 2, y: 2 },
      { x: 58, y: 2 },
      { x: 2, y: 38 },
      { x: 58, y: 38 },
    ]}
  />
)
```

### WideBannerFitted

```jsx
() => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><text x="28" y="120" font-family="Arial" font-size="64" font-weight="700" fill="#f2c230">AKCIÓ</text></svg>',
    );
  return <ScalePreview widthCm={500} heightCm={100} imageUrl={artwork} fit="fit" />;
}
```
