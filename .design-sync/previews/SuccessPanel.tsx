import { Button, ButtonLink, SuccessPanel } from '@stiletdekor/ui';

export const QuoteReceived = () => (
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
);

export const OrderReceived = () => (
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
);
