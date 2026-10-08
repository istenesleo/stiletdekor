## Stilet Dekor conventions (read first)

Stilet Dekor is a Budapest sign and print workshop: a webshop with instant gross prices, and custom quotes.

**Wrap every screen in `ThemeRoot`.** It selects the design direction and paints the dark page: `theme="neon-muhely"`
(A, Neon műhely) or `theme="galeria-editorial"` (B, Galéria). Without it the tokens fall back to a neutral base
with system fonts. A ThemeRoot inside another fully re-themes its part, so A and B can sit side by side.

```jsx
const { ThemeRoot, SiteHeader, SiteFooter, SectionHeader, SizeFields, PriceBreakdown, Button } = window.StiletUI;
<ThemeRoot theme="neon-muhely">
  <SiteHeader cartCount={1} onCartClick={openCart} />
  <main id="tartalom" style={{ maxWidth: 'var(--layout-container)', margin: '0 auto',
    padding: 'var(--space-7) var(--layout-gutter)', display: 'grid', gap: 'var(--space-5)' }}>
    <SectionHeader eyebrow="Webshop · azonnali ár" title="Molinó" lead="Méret, anyag, grafika: az árat azonnal látja." />
    <SizeFields width="200" height="100" onWidthChange={setW} onHeightChange={setH} onSwap={swap} />
    <PriceBreakdown rows={[{ label: 'Anyag · Standard frontlit', detail: '2,00 m² × 5 067 Ft', amount: 10135 }]} total={10135} />
    <Button icon="cart">Kosárba</Button>
  </main>
  <SiteFooter />
</ThemeRoot>
```

**Styling idiom: tokens, no utility framework.** Components style themselves; set their props, never restyle
`sd-*` classes. For your own layout glue use inline styles with the CSS variables:
- spacing `--space-1` … `--space-9` (0.25rem … 6rem); layout `--layout-container`, `--layout-gutter`, `--layout-section-gap`
- color `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-line`, `--color-text`, `--color-text-muted`,
  `--color-brand` (the only pink; one primary action per view), `--color-on-brand`, `--color-measure` (sizes and
  technical data), `--color-signal-ok`, `--color-signal-warn`, `--color-signal-bad`
- type `--font-display` with `--weight-display` and `font-variation-settings: var(--font-variation-display)` for
  headings; `--font-body`; `--font-mono` for prices, sizes and references; sizes `--text-xs` … `--text-2xl`,
  `--text-hero`; `--leading-tight`, `--leading-snug`, `--leading-body`
- `--radius-sm`, `--radius-md`, `--radius-pill`, `--effect-brand-glow`
Helper classes: `sd-caps` (small uppercase label), `sd-vh` (visually hidden), `sd-input` (a native input or select
inside `Field`).

**Props.** Each `.d.ts` lists the library's own props. Native attributes pass through to the underlying element:
`onClick`, `disabled`, `type`, `name`, `value`, `defaultValue`, `onChange`, `checked`, `placeholder`, `required`,
`autoComplete`, `aria-*`.

**Content rules.** Hungarian, formal address ("Töltse fel", "Válasszon"). Gross prices only, in forints:
`12 990 Ft`; units after a space: `200×100 cm`, `2,00 m²` (decimal comma). The order button reads
"Rendelés elküldése ellenőrzésre": sending is not a payment; we check the files, then send a pro forma invoice
("díjbekérő"), and paying it accepts the order. Express production is +30%. Delivery: personal pickup at the
workshop, courier, or with installation (priced individually: `amountText="egyedi"`). Under calculated prices:
"A végleges ár eltérhet a kalkulált ártól."

**Where the truth lives.** `styles.css` imports `_ds_bundle.css`: the tokens (`:root`, then
`[data-theme="neon-muhely"]` and `[data-theme="galeria-editorial"]`) and every component's styles. Per component:
`components/<group>/<Name>/<Name>.prompt.md` with props and examples; groups are basics, forms, shop, quote,
content.

# StiletUI (@stiletdekor/ui@0.1.0)

This design system is the published @stiletdekor/ui React library, bundled as a single
browser global. All 45 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.StiletUI`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.StiletUI.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Badge } = window.StiletUI;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Badge />);
```

Wrap the tree in the provider — most components read theme/i18n from context:

```jsx
<ThemeRoot theme={"neon-muhely"}>{children}</ThemeRoot>
```

## Tokens

66 CSS custom properties from @stiletdekor/ui. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (20): `--color-brand`, `--color-on-brand`, `--color-bg`, …
- **spacing** (10): `--space-1`, `--space-2`, `--space-3`, …
- **typography** (11): `--font-display`, `--font-body`, `--font-mono`, …
- **radius** (4): `--radius-none`, `--radius-sm`, `--radius-md`, …
- **other** (21): `--leading-tight`, `--leading-snug`, `--leading-body`, …

## Components

### basics
- `Badge` — Short uppercase label for a status or a property of an item. Not interactive.
- `Button` — Button for an action: one primary per view, secondary or ghost for the rest.
- `ButtonLink` — A link that looks like a Button, for navigation.
- `DimensionLine` — The brand's measuring motif: a dimension line with arrowheads, end ticks and the size in millimetres.
- `Divider` — Hairline that separates groups of content, optionally with a label naming the group that follows.
- `Icon` — A line icon from the Stilet set, drawn in the current text color. Decorative unless it gets a label.
- `IconButton` — Square button with a single icon: cart (with item count), menu, close, swap width and height.
- `NavLink` — Link in the header menu or a section menu, with an active state.
- `Notice` — A message bar for info, warning, error or success. Keep it to one or two sentences.
- `OrderStatusBadge` — The status of an order as a badge with its customer-facing label.
- `SectionHeader` — Eyebrow, title and lead at the top of a page section.
- `TextLink` — Link inside running text: underlined in the brand color, turns brand-colored on hover.
- `ThemeRoot` — Sets the design direction (theme) for everything inside it: token values, page background, body text.
- `Wordmark` — Typographic wordmark until the logo exists. Links home.

### shop
- `CartLine` — One item in the cart: thumbnail, what it is, its gross price, and a remove button.
- `CategoryTile` — Product category tile with its from-price: a link on the home page, a selector in the webshop.
- `CheckoutSection` — A numbered part of the checkout: contact details, billing, delivery.
- `DiscountHint` — Nudge toward the next quantity discount. Renders nothing at the top tier.
- `Drawer` — Side panel that opens from the right over the page, used for the cart.
- `LeadTimeNote` — Expected completion date of an order, with the rules in small type.
- `OrderSubmit` — The end of the checkout: accept the terms, see what happens next, and send the order for checking.
- `PriceBreakdown` — Itemised price: one row per component of the price, the gross total large, net and VAT small under it.
- `ReadinessLight` — Print-readiness traffic light: green from 150 dpi, yellow from 72, red below.
- `ScalePreview` — The product at real scale next to a 180 cm figure, with dimension lines in millimetres.
- `SurfaceList` — The surfaces of a multi-page PDF (a surface package, e.g. window film per window).

### forms
- `Checkbox` — Checkbox with a label and an optional description, e.g. for accepting the terms.
- `ChipGroup` — One-click choices as chips, one selectable at a time: common sizes (size presets), filters.
- `Field` — Label, control, help text and error in the library's layout, for wrapping a custom control.
- `FileDrop` — Drop zone for artwork and photos: drag files onto it or pick them with the button.
- `FileList` — Uploaded files with thumbnail, name, size, what was recognized and a status, each removable.
- `FitPicker` — Fill (crop) or fit (frame) when the artwork's aspect ratio differs from the product's.
- `MaterialPicker` — Material choice as cards: swatch, name, gross price per square metre and a small data sheet.
- `OptionRow` — A selectable option with its price preview: the unit rate and what it costs for the chosen size.
- `QuantityStepper` — Quantity with minus and plus buttons and a field for typing.
- `SegmentedChoice` — Two to four mutually exclusive choices side by side, with optional descriptions.
- `SizeFields` — Width and height fields with a swap button between them, as in the configurator.
- `Switch` — On/off switch for an option that changes the result immediately, e.g. express production.
- `TextField` — Labeled text input for name, e-mail, phone or address, or several lines with multiline.
- `UnitField` — Number input with its unit inside the field: sizes in cm, quantities in db.

### content
- `ContactBlock` — The workshop's contacts with call, write, map and copy buttons, plus the opening hours.
- `SiteFooter` — The site footer: wordmark, link columns, the workshop's contacts and the legal links.
- `SiteHeader` — The site header: wordmark, main menu, phone number, quote button and the cart with its item count.

### quote
- `JobTypePicker` — First step of the quote wizard: the nine custom job types as selectable cards with pictograms.
- `Stepper` — Progress through a multi-step form such as the quote wizard, with the steps as a bar.
- `SuccessPanel` — Confirmation after a quote request or an order: what we received, its reference, and what happens next.
