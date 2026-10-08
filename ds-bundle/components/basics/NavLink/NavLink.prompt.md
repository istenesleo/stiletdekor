NavLink from @stiletdekor/ui. Use via `window.StiletUI.NavLink` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Link in the header menu or a section menu, with an active state.
@category basics

## Props

```ts
interface NavLinkProps {
  href: string;
  /** The page (or section) the visitor is on: marked with aria-current and a brand-colored bar. */
  current?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### MainMenu

```jsx
() => (
  <nav aria-label="Főmenü" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
    <NavLink href="#szolgaltatasok">Szolgáltatások</NavLink>
    <NavLink href="#webshop" current>
      Webshop
    </NavLink>
    <NavLink href="#referenciak">Referenciák</NavLink>
    <NavLink href="#kapcsolat">Kapcsolat</NavLink>
  </nav>
)
```
