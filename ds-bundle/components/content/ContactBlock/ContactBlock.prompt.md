ContactBlock from @stiletdekor/ui. Use via `window.StiletUI.ContactBlock` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The workshop's contacts with call, write, map and copy buttons, plus the opening hours.
Phone, e-mail and address are selectable text, for the contact section and the order confirmation. Copying
is announced to screen readers; where the clipboard is not available the text gets selected instead.
@category content

## Props

```ts
interface ContactBlockProps {
  /** The workshop's number by default. */
  phone?: { display: string; href: string; };
  /** The workshop's e-mail address by default. */
  email?: string;
  /** The workshop's address by default. */
  address?: string;
  /** Map link for the address, opened in a new tab; a map search for the address by default, null hides it. */
  mapHref?: string;
  /** The workshop's opening hours by default; null hides the row. */
  openingHours?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Workshop

```jsx
() => <ContactBlock />
```
