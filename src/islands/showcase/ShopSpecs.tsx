import { useState } from 'react';
import { nextDiscountHint } from '@/domain/pricing';
import {
  Badge,
  Button,
  CartLine,
  CategoryTile,
  CheckoutSection,
  DiscountHint,
  Drawer,
  LeadTimeNote,
  OptionRow,
  OrderSubmit,
  PriceBreakdown,
  type ProductKind,
  ReadinessLight,
  ScalePreview,
  type Surface,
  SurfaceList,
  TextField,
} from '@/ui';
import { Cell, Group, Spec } from './parts';

// Sample customer artwork for the previews (any colors: it stands for an uploaded file, not for the UI).
const ART =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><rect y="150" width="400" height="50" fill="#f2c230"/><circle cx="330" cy="70" r="38" fill="#f2c230"/><text x="28" y="92" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">NYITÁS</text><text x="30" y="128" font-family="Arial, sans-serif" font-size="20" fill="#ffffff">október 12-től</text></svg>',
  );

const TILES: Array<{ product: ProductKind; name: string; price: number; unit?: 'm2' | 'db' }> = [
  { product: 'molino', name: 'Molinó', price: 5067, unit: 'm2' },
  { product: 'rollup', name: 'Roll-up', price: 31623 },
  { product: 'matrica', name: 'Matrica', price: 8877, unit: 'm2' },
  { product: 'plakat', name: 'Plakát', price: 1257 },
  { product: 'tabla', name: 'Tábla', price: 12687, unit: 'm2' },
  { product: 'vaszon', name: 'Vászonkép', price: 10147 },
];

const SURFACES: Surface[] = [
  { id: 'a', label: 'Bejárati ajtó', pages: [1, 3], widthMm: 900, heightMm: 2100, count: 2 },
  { id: 'b', label: 'Kirakat, bal', pages: [2], widthMm: 2400, heightMm: 1800, count: 1 },
  { id: 'c', label: 'Kirakat, jobb', pages: [4], widthMm: 2400, heightMm: 1800, count: 1 },
  { id: 'd', label: 'Nyitvatartás-matrica', pages: [5], widthMm: 300, heightMm: 400, count: 1, skipped: true },
];

const DELIVERY = [
  { id: 'pickup', label: 'Személyes átvétel a műhelyben', description: 'Budapest, Schweidel József u. 1–3.', amount: 0 },
  { id: 'courier', label: 'Futár', description: 'Nagy csomag (roll-up, tábla): 6 337 Ft', amount: 3797 },
  { id: 'install', label: 'Telepítéssel', description: 'A helyszínen felszereljük. A díját a visszaigazoláskor adjuk meg.', amountText: 'egyedi' },
];

interface ShopSpecsProps {
  /** The sample cart drawer; the page header's cart button opens it too. */
  cartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
}

/** Webshop and order components with working state. */
export function ShopSpecs({ cartOpen, onCartOpenChange: setCartOpen }: ShopSpecsProps) {
  const [product, setProduct] = useState<ProductKind>('molino');
  const [surfaces, setSurfaces] = useState(SURFACES);
  const [sets, setSets] = useState(2);
  const [delivery, setDelivery] = useState('pickup');
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const hint = nextDiscountHint(3);

  const submit = () => {
    setTried(true);
    if (!accepted) return;
    setSending(true);
    setTimeout(() => setSending(false), 1500);
  };

  return (
    <>
      <Group id="webshop" title="Webshop és rendelés" />
      <Spec title="Termékkategória · CategoryTile" desc="A kezdőlapon link, a webshopban választó (egy lenyomva)." wide>
        <Cell caption="linkként">
          <div className="uis-tiles">
            {TILES.map((t) => (
              <CategoryTile key={t.product} {...t} href="#webshop" />
            ))}
          </div>
        </Cell>
        <Cell caption="választóként">
          <div className="uis-tiles">
            {TILES.map((t) => (
              <CategoryTile key={t.product} {...t} pressed={t.product === product} onClick={() => setProduct(t.product)} />
            ))}
          </div>
        </Cell>
      </Spec>

      <Spec title="Valós léptékű előnézet · ScalePreview" desc="A termék valós méretben a 180 cm-es alak mellett, mm-es méretvonalakkal." wide>
        <Cell caption="molinó 200×100, grafika nélkül">
          <ScalePreview widthCm={200} heightCm={100} />
        </Cell>
        <Cell caption="roll-up 85×200, állvánnyal, kitöltve">
          <ScalePreview widthCm={85} heightCm={200} stand imageUrl={ART} />
        </Cell>
        <Cell caption="tábla 60×40, 4 sarokfurattal">
          <ScalePreview
            widthCm={60}
            heightCm={40}
            elevationCm={110}
            marks={[
              { x: 2, y: 2 },
              { x: 58, y: 2 },
              { x: 2, y: 38 },
              { x: 58, y: 38 },
            ]}
          />
        </Cell>
        <Cell caption="molinó 500×100, illesztve">
          <ScalePreview widthCm={500} heightCm={100} imageUrl={ART} fit="fit" />
        </Cell>
      </Spec>

      <Spec title="Nyomdakész-lámpa · ReadinessLight" wide>
        <Cell caption="üres">
          <ReadinessLight />
        </Cell>
        <Cell caption="kiváló">
          <ReadinessLight rating="kivalo" dpi={212} />
        </Cell>
        <Cell caption="megfelelő">
          <ReadinessLight rating="megfelelo" dpi={96} />
        </Cell>
        <Cell caption="gyenge">
          <ReadinessLight rating="gyenge" dpi={48} />
        </Cell>
        <Cell caption="vektoros">
          <ReadinessLight vector />
        </Cell>
      </Spec>

      <Spec title="Árbontás · PriceBreakdown · Kedvezmény-tipp · Várható határidő" wide>
        <Cell caption="konfigurátor">
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
        </Cell>
        <Cell caption="tipp és határidő">
          <div className="uis-stack">
            {hint && <DiscountHint additionalQty={hint.additionalQty} pct={hint.pct} />}
            <LeadTimeNote readyBy="2026-10-13" />
            <LeadTimeNote readyBy="2026-10-08" express />
          </div>
        </Cell>
      </Spec>

      <Spec title="Felületlista · SurfaceList" desc="Több oldalas PDF felületei, az azonos oldalak összevonva; készletszám és kihagyás." wide>
        <Cell caption="kirakatfólia, 5 oldal">
          <SurfaceList
            surfaces={surfaces}
            sets={sets}
            onSetsChange={setSets}
            onToggleSkip={(id) => setSurfaces((list) => list.map((s) => (s.id === id ? { ...s, skipped: !s.skipped } : s)))}
          />
        </Cell>
      </Spec>

      <Spec title="Kosár · Drawer, CartLine · Pénztár · CheckoutSection, OrderSubmit" wide>
        <Cell caption="kosárfiók">
          <div className="uis-stack">
            <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 3 db" price={36494} thumbnailUrl={ART} />
            <CartLine
              title="Roll-up · teljes"
              spec="85×200 cm · táskával · 1 db"
              price={31623}
              product="rollup"
              badges={<Badge tone="brand">Expressz</Badge>}
              onRemove={() => {}}
            />
            <Button icon="cart" onClick={() => setCartOpen(true)}>
              Kosár megnyitása
            </Button>
          </div>
          <Drawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            title="Kosár"
            footer={
              <>
                <PriceBreakdown
                  caption="Kosár összesítő"
                  rows={[
                    { label: 'Termékek', amount: 68117 },
                    {
                      label: 'Átvétel',
                      ...(delivery === 'install' ? { amountText: 'egyedi' } : { amount: delivery === 'courier' ? 6337 : 0 }),
                    },
                  ]}
                  totalLabel="Kalkulált végösszeg, bruttó"
                  total={68117 + (delivery === 'courier' ? 6337 : 0)}
                />
                <OrderSubmit
                  accepted={accepted}
                  onAcceptedChange={setAccepted}
                  error={tried && !accepted ? 'Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.' : undefined}
                  loading={sending}
                  onSubmit={submit}
                />
              </>
            }
          >
            <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 3 db" price={36494} thumbnailUrl={ART} onRemove={() => {}} />
            <CartLine title="Roll-up · teljes" spec="85×200 cm · táskával · 1 db" price={31623} product="rollup" onRemove={() => {}} />
          </Drawer>
        </Cell>
        <Cell caption="pénztár-szakaszok">
          <CheckoutSection step={1} title="Adatok">
            <TextField label="Név" autoComplete="name" required />
            <TextField label="E-mail" type="email" autoComplete="email" required />
          </CheckoutSection>
          <CheckoutSection step={2} title="Átvétel" description="A futár és a telepítés díja a visszaigazolásban véglegesedik.">
            {DELIVERY.map((d) => (
              <OptionRow
                key={d.id}
                name="delivery"
                label={d.label}
                description={d.description}
                amount={'amount' in d ? d.amount : undefined}
                amountText={'amountText' in d ? d.amountText : undefined}
                checked={delivery === d.id}
                onChange={() => setDelivery(d.id)}
              />
            ))}
          </CheckoutSection>
        </Cell>
      </Spec>
    </>
  );
}
