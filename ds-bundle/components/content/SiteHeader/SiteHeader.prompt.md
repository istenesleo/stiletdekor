SiteHeader from @stiletdekor/ui. Use via `window.StiletUI.SiteHeader` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The site header: wordmark, main menu, phone number, quote button and the cart with its item count.
Sticky, on a translucent background. When the header is narrower than 1040 px, the menu, the phone number
and the "Ajánlatkérés" button move into a panel opened by the menu button; Escape closes it. The page's main
content needs the id of `skipTo` ("tartalom" by default).
@category content

## Props

```ts
interface SiteHeaderProps {
  /** The main menu; the site's sections (MAIN_NAV) by default. */
  links?: readonly NavItem[];
  /** href of the page or section the visitor is on: that menu item is marked as current. */
  currentHref?: string;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Phone number shown on wide screens and in the mobile menu; the workshop's by default, null hides it. */
  phone?: { display: string; href: string; };
  /** Target of the "Ajánlatkérés" button, the quote wizard by default. */
  quoteHref?: string;
  /** Items in the cart, shown on the cart button. */
  cartCount?: number;
  /** Opens the cart drawer. Without it there is no cart button. */
  onCartClick?: () => void;
  /** Stays at the top of the window while scrolling (default). Turn it off in previews. */
  sticky?: boolean;
  /** Target of the "Ugrás a tartalomra" skip link, the page's main content; null leaves the link out. */
  skipTo?: string;
  /** Starts with the mobile menu open (previews). */
  defaultMenuOpen?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### Desktop

```jsx
() => {
  const [items, setItems] = useState(2);
  return <SiteHeader sticky={false} currentHref="/#webshop" cartCount={items} onCartClick={() => setItems((n) => n + 1)} />;
}
```

### PhoneWithMenuOpen

```jsx
() => (
  <div style={{ maxWidth: 390, minHeight: 600 }}>
    <SiteHeader sticky={false} skipTo={null} defaultMenuOpen cartCount={2} onCartClick={() => {}} />
  </div>
)
```
