Wordmark from @stiletdekor/ui. Use via `window.StiletUI.Wordmark` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Typographic wordmark until the logo exists. Links home.
Reads "STILET • DEKOR".
@category basics

## Props

```ts
interface WordmarkProps {
  /** Where it links, the home page by default. */
  href?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Default

```jsx
() => <Wordmark />
```

### Large

```jsx
() => <Wordmark style={{ fontSize: 'var(--text-xl)' }} />
```
