LeadTimeNote from @stiletdekor/ui. Use via `window.StiletUI.LeadTimeNote` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Expected completion date of an order, with the rules in small type.
E.g. "Várhatóan október 13-ára, keddre elkészül." Production counts from the payment, the date includes one
business day for confirmation and payment, weekends and holidays don't count.
@category shop

## Props

```ts
interface LeadTimeNoteProps {
  /** Estimated ready date (the domain's estimateOrderReadyDate), "YYYY-MM-DD". */
  readyBy: string;
  /** Express production: adds an "Expressz" badge and says 1 business day. */
  express?: boolean;
  /** Production time in business days without express; 3 by default. */
  productionDays?: number;
  /** Replaces the small line under the date. */
  detail?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Standard

```jsx
() => <LeadTimeNote readyBy="2026-10-13" />
```

### Express

```jsx
() => <LeadTimeNote readyBy="2026-10-08" express />
```
