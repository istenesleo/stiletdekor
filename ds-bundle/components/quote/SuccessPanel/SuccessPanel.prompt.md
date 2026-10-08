SuccessPanel from @stiletdekor/ui. Use via `window.StiletUI.SuccessPanel` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Confirmation after a quote request or an order: what we received, its reference, and what happens next.
@category quote

## Props

```ts
interface SuccessPanelProps {
  /** "Megkaptuk az ajánlatkérését", "Megkaptuk a rendelését". */
  title: string;
  /** The reference the customer can quote on the phone, e.g. "AK-2026-0142". */
  reference?: string;
  /** Label before the reference, "Azonosító" by default. */
  referenceLabel?: string;
  /** What happens next, in order ("Visszahívjuk egy munkanapon belül." …). */
  nextSteps?: readonly ReactNode[];
  /** Small print, e.g. "A végleges árajánlat eltérhet a kalkulált ártól.". */
  note?: React.ReactNode;
  /** Buttons or links, e.g. "Új ajánlatkérés". */
  actions?: React.ReactNode;
  /** Moves focus to the title when shown, so screen readers announce it after a submit. */
  autoFocus?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### QuoteReceived

```jsx
() => (
  <SuccessPanel
    title="Megkaptuk az ajánlatkérését"
    reference="AK-2026-0142"
    nextSteps={[
      'Átnézzük a leírást és a fotókat.',
      'Egy munkanapon belül visszahívjuk, és ha kell, egyeztetjük a helyszíni felmérést.',
      'E-mailben elküldjük az árajánlatot.',
    ]}
    actions={
      <>
        <ButtonLink href="/" variant="secondary">
          Vissza a kezdőlapra
        </ButtonLink>
        <Button variant="ghost">Új ajánlatkérés</Button>
      </>
    }
  />
)
```

### OrderReceived

```jsx
() => (
  <SuccessPanel
    title="Megkaptuk a rendelését"
    reference="R-2026-0087"
    referenceLabel="Rendelésszám"
    nextSteps={[
      'Ellenőrizzük a fájlokat és a méreteket.',
      'Díjbekérőt küldünk e-mailben; a befizetésével fogadja el a rendelést.',
      'A befizetés után gyártjuk, és értesítjük, amikor elkészült.',
    ]}
    note="A végleges ár eltérhet a kalkulált ártól."
  >
    <p>A visszaigazolást elküldtük a megadott e-mail-címre.</p>
  </SuccessPanel>
)
```
