ReadinessLight from @stiletdekor/ui. Use via `window.StiletUI.ReadinessLight` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Print-readiness traffic light: green from 150 dpi, yellow from 72, red below.
Yellow is fine for banners seen from a distance. Shows the effective dpi at the chosen size and what it
means.
@category shop

## Props

```ts
interface ReadinessLightProps {
  /** kivalo / megfelelo / gyenge (from the domain's preflight); empty before a file is uploaded. */
  rating?: "kivalo" | "megfelelo" | "gyenge";
  /** Effective resolution at the chosen size. */
  dpi?: number;
  /** Vector artwork: sharp at any size, so the light is green without a dpi. */
  vector?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Excellent

```jsx
() => <ReadinessLight rating="kivalo" dpi={212} />
```

### Acceptable

```jsx
() => <ReadinessLight rating="megfelelo" dpi={96} />
```

### Poor

```jsx
() => <ReadinessLight rating="gyenge" dpi={48} />
```

### Vector

```jsx
() => <ReadinessLight vector />
```

### NoFileYet

```jsx
() => <ReadinessLight />
```
