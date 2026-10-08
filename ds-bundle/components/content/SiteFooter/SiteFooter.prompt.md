SiteFooter from @stiletdekor/ui. Use via `window.StiletUI.SiteFooter` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The site footer: wordmark, link columns, the workshop's contacts and the legal links.
Contacts: phone, e-mail, address, opening hours. The bottom row carries the copyright line.
@category content

## Props

```ts
interface SiteFooterProps {
  /** Link columns before the contact column; the site's services and ordering links by default. */
  columns?: readonly FooterColumn[];
  /** Legal pages in the bottom row: ÁSZF, Adatkezelési tájékoztató, Impresszum by default. */
  legal?: readonly NavItem[];
  /** One line about what we do, under the wordmark. */
  tagline?: React.ReactNode;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Year in the copyright line, the current year by default. */
  year?: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Default

```jsx
() => <SiteFooter year={2026} />
```
