DiscountHint from @stiletdekor/ui. Use via `window.StiletUI.DiscountHint` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Nudge toward the next quantity discount. Renders nothing at the top tier.
E.g. "Még 2 db és −10%".
@category shop

## Props

```ts
interface DiscountHintProps {
  /** Pieces still needed for the next tier (the domain's nextDiscountHint().additionalQty). */
  additionalQty: number;
  /** Discount of that tier in percent. */
  pct: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### NextTier

```jsx
() => <DiscountHint additionalQty={2} pct={10} />
```

### OneMore

```jsx
() => <DiscountHint additionalQty={1} pct={5} />
```
