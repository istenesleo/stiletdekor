TextLink from @stiletdekor/ui. Use via `window.StiletUI.TextLink` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Link inside running text: underlined in the brand color, turns brand-colored on hover.
@category basics

## Props

```ts
interface TextLinkProps {
  href: string;
  /** Opens in a new tab (rel="noopener noreferrer") and shows a small external-link icon. */
  external?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### InText

```jsx
() => (
  <p style={{ margin: 0 }}>
    A rendeléssel elfogadja az <TextLink href="/aszf">ÁSZF-et</TextLink> és az{' '}
    <TextLink href="/adatkezeles">adatkezelési tájékoztatót</TextLink>.
  </p>
)
```

### External

```jsx
() => (
  <p style={{ margin: 0 }}>
    A műhely útvonala a{' '}
    <TextLink href="https://www.google.com/maps/search/?api=1&query=Budapest%2C%20Schweidel%20J%C3%B3zsef%20u.%201" external>
      térképen
    </TextLink>
    .
  </p>
)
```
