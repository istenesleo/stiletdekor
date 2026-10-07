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
