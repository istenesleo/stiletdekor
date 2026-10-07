import { PriceBreakdown } from '@stiletdekor/ui';

export const Configurator = () => (
  <PriceBreakdown
    rows={[
      { label: 'Anyag · Standard frontlit', detail: '2,00 m² × 5 067 Ft', amount: 10135 },
      { label: 'Szélkidolgozás · Szegés + ringli', detail: '6,00 fm × 445 Ft', amount: 2670 },
      { label: 'Egységár, 3 db', detail: '3 × 12 805 Ft', amount: 38415, kind: 'muted' },
      { label: 'Mennyiségi kedvezmény (−5%)', amount: -1921, kind: 'discount' },
      { label: 'Expressz (+30%)', amount: 10948 },
    ]}
    total={47442}
    net={37356}
    vat={10086}
    note="A végleges ár eltérhet a kalkulált ártól."
  />
);

export const CartSummary = () => (
  <PriceBreakdown
    caption="Kosár összesítő"
    rows={[
      { label: 'Termékek', amount: 68117 },
      { label: 'Átvétel', amountText: 'egyedi' },
    ]}
    totalLabel="Kalkulált végösszeg, bruttó"
    total={68117}
  />
);
