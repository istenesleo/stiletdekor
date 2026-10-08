CheckoutSection from @stiletdekor/ui. Use via `window.StiletUI.CheckoutSection` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

A numbered part of the checkout: contact details, billing, delivery.
@category shop

## Props

```ts
interface CheckoutSectionProps {
  /** Step number shown in a circle (1 Adatok, 2 Számlázás, 3 Átvétel). */
  step?: number;
  title: React.ReactNode;
  /** One line under the title. */
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### ContactDetails

```jsx
() => (
  <CheckoutSection step={1} title="Adatok">
    <TextField label="Név" autoComplete="name" required />
    <TextField label="E-mail" type="email" autoComplete="email" required />
    <TextField label="Telefon" type="tel" autoComplete="tel" help="Erre a számra hívjuk vissza." />
  </CheckoutSection>
)
```

### Delivery

```jsx
() => {
  const [delivery, setDelivery] = useState('pickup');
  return (
    <CheckoutSection step={2} title="Átvétel" description="A futár és a telepítés díja a visszaigazolásban véglegesedik.">
      <OptionRow name="delivery" label="Személyes átvétel a műhelyben" description="Budapest, Schweidel József u. 1–3." amount={0} checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />
      <OptionRow name="delivery" label="Futár" description="Nagy csomag (roll-up, tábla): 6 337 Ft" amount={3797} checked={delivery === 'courier'} onChange={() => setDelivery('courier')} />
      <OptionRow name="delivery" label="Telepítéssel" description="A helyszínen felszereljük." amountText="egyedi" checked={delivery === 'install'} onChange={() => setDelivery('install')} />
    </CheckoutSection>
  );
}
```
