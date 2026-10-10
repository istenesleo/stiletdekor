// The product page's island (client:only="react"): the product's options, the print files, the live gross price with
// its breakdown, the ready date and "Kosárba". A cart item opens for editing with /webshop/<termek>#tetel=<key>
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 3.).
import { useMemo, useState } from 'react';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import type { CartEntry } from '@/domain/cart';
import { MAX_QUANTITY, type ShopProductId } from '@/domain/catalog';
import { estimateOrderReadyDate } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import type { FitMode } from '@/domain/preflight';
import { configDimensionsCm, tryPriceConfiguration } from '@/domain/pricing';
import { MAX_ORDER_ITEMS } from '@/domain/schemas';
import { Button } from '@/ui/Button/Button';
import { DiscountHint } from '@/ui/DiscountHint/DiscountHint';
import { FitPicker } from '@/ui/FitPicker/FitPicker';
import { LeadTimeNote } from '@/ui/LeadTimeNote/LeadTimeNote';
import { Notice } from '@/ui/Notice/Notice';
import { PriceBreakdown } from '@/ui/PriceBreakdown/PriceBreakdown';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { ReadinessLight } from '@/ui/ReadinessLight/ReadinessLight';
import { ScalePreview } from '@/ui/ScalePreview/ScalePreview';
import { Switch } from '@/ui/Switch/Switch';
import { ArtworkField } from './ArtworkField';
import { artworkSizeFor, preflightSummary } from './artwork-size';
import { CartDrawer } from './CartDrawer';
import { readCart, useCart } from './cart-store';
import { defaultDraft, type Draft, draftFromConfig, draftIssues, draftToConfig, sizeText } from './draft';
import { DISCOUNT_SUMMARY, priceRows } from './price-rows';
import { ProductOptions } from './ProductOptions';
import { useArtworkFiles } from './useArtworkFiles';
import { useDebounced } from './useDebounced';
import './shop.css';

/** The cart item of this product named in the address (#tetel=<key>), for editing. */
function editedEntry(productId: ShopProductId): CartEntry | null {
  const key = new URLSearchParams(window.location.hash.slice(1)).get('tetel');
  if (!key) return null;
  return readCart().entries.find((entry) => entry.key === key && entry.config.productId === productId) ?? null;
}

export interface ConfiguratorProps {
  productId: ShopProductId;
}

export function Configurator({ productId }: ConfiguratorProps) {
  const cart = useCart();
  const [editing] = useState(() => editedEntry(productId));
  const [draft, setDraft] = useState<Draft>(() => (editing ? draftFromConfig(editing.config) : defaultDraft(productId)));
  const [sizeFromFile, setSizeFromFile] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>(editing?.preflight?.fitMode ?? 'fill');
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const change = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  // The first file sets the size (and the format, where the product has formats), without a confirm button (brief 8).
  const applyArtwork = (analysis: ArtworkAnalysis, first: boolean) => {
    if (!first) return;
    const size = artworkSizeFor(productId, analysis);
    if (!size) {
      setFileNote('A fájlból nem tudtuk kiolvasni a méretet. Adja meg kézzel.');
      return;
    }
    const notes: string[] = [];
    if (size.scale) notes.push(`A fájl 1:${size.scale} méretarányú rajznak tűnik, ezért a méretet ennek megfelelően állítottuk be.`);
    if (size.multiPage) notes.push('A fájl több oldalas: az első oldal méretét vettük alapul, a többit a műhely egyezteti.');
    const sized = { width: sizeText(size.widthCm), height: sizeText(size.heightCm) };
    setDraft((current) => {
      if (size.formatId) {
        return {
          ...current,
          formatId: size.formatId,
          ...(size.orientation ? { orientation: size.orientation } : {}),
          ...(size.formatId === 'egyedi' ? sized : {}),
        };
      }
      if (productId === 'rollup') return current;
      if (productId === 'plakat') return current.formatId === 'blueback' ? { ...current, ...sized } : current;
      return { ...current, ...sized };
    });
    if (productId === 'plakat' && !size.formatId) {
      notes.push(`A fájl mérete (${sized.width} × ${sized.height} cm) nem szabványos plakátméret. Válasszon formátumot, vagy kérjen ajánlatot.`);
    }
    setFileNote(notes.length > 0 ? notes.join(' ') : null);
    setSizeFromFile(true);
  };

  const files = useArtworkFiles({ initial: editing?.files ?? [], analyze: true, onAnalysis: applyArtwork });

  const config = useMemo(() => draftToConfig(draft), [draft]);
  const issues = useMemo(() => draftIssues(draft), [draft]);
  const priced = useMemo(() => tryPriceConfiguration(config), [config]);
  const price = priced.ok ? priced.price : null;
  const dims = price ? configDimensionsCm(config) : null;
  const analysis = files.files.find((file) => file.analysis)?.analysis;
  const preflight = analysis && dims ? preflightSummary(analysis, dims.widthCm, dims.heightCm, fitMode) : null;
  const vector = analysis?.confidence === 'exact';
  const announced = useDebounced(price ? `Kalkulált ár: ${formatHuf(price.grossTotal)}` : '', 600);
  const full = !editing && cart.entries.length >= MAX_ORDER_ITEMS;

  const addToCart = () => {
    if (!price) return;
    const entry: CartEntry = {
      key: editing?.key ?? crypto.randomUUID(),
      config,
      files: files.uploaded,
      ...(preflight ? { preflight } : {}),
      addedAt: editing?.addedAt ?? new Date().toISOString(),
    };
    if (editing) {
      cart.replace(entry);
    } else {
      cart.add(entry);
      // The next item starts without this one's files.
      files.clear();
      setSizeFromFile(false);
      setFileNote(null);
    }
    setDrawerOpen(true);
  };

  return (
    <div className="shop-cfg">
      <div className="shop-cfg__options">
        {editing && <Notice>A kosárban lévő tételt módosítja.</Notice>}
        <ProductOptions draft={draft} issues={issues} onChange={change} sizeFromFile={sizeFromFile} onSizeTyped={() => setSizeFromFile(false)} />
        <section className="shop-cfg__group" aria-labelledby="shop-cfg-files">
          <h3 id="shop-cfg-files">
            Grafika <span className="shop-cfg__optional">(nem kötelező)</span>
          </h3>
          <ArtworkField files={files} />
          {fileNote && <Notice live="polite">{fileNote}</Notice>}
        </section>
        <QuantityStepper value={draft.quantity} onChange={(quantity) => change({ quantity })} max={MAX_QUANTITY} help={DISCOUNT_SUMMARY} error={issues.quantity} />
        <Switch
          label="Expressz gyártás"
          description="1 munkanap, +30%. A visszaigazoláskor derül ki, vállalható-e."
          checked={draft.express}
          onChange={(event) => change({ express: event.target.checked })}
        />
      </div>
      <aside className="shop-cfg__summary" aria-label="Összesítő">
        {dims && (
          <ScalePreview
            widthCm={dims.widthCm}
            heightCm={dims.heightCm}
            imageUrl={files.files.find((file) => file.previewUrl)?.previewUrl}
            fit={fitMode}
            stand={productId === 'rollup'}
          />
        )}
        {preflight?.aspectMismatch && <FitPicker value={fitMode} onChange={setFitMode} />}
        {(preflight || vector) && <ReadinessLight rating={preflight?.rating} dpi={preflight?.dpi} vector={vector && !preflight} />}
        {price ? (
          <PriceBreakdown rows={priceRows(price)} total={price.grossTotal} net={price.netTotal} vat={price.vatTotal} note={FINAL_PRICE_NOTICE} />
        ) : (
          <Notice tone="warning">Javítsa a jelölt beállítást, és megmutatjuk az árat.</Notice>
        )}
        {price?.nextDiscountHint && <DiscountHint additionalQty={price.nextDiscountHint.additionalQty} pct={price.nextDiscountHint.pct} />}
        <LeadTimeNote readyBy={estimateOrderReadyDate(new Date(), { express: draft.express })} express={draft.express} />
        <p className="sd-vh" aria-live="polite">
          {announced}
        </p>
        <Button block onClick={addToCart} disabled={!price || files.busy || full}>
          {editing ? 'Tétel frissítése' : 'Kosárba'}
        </Button>
        {files.busy && <p className="shop-cfg__wait">A feltöltés befejezése után teheti kosárba.</p>}
        {full && <p className="shop-cfg__wait">A kosárban legfeljebb {MAX_ORDER_ITEMS} tétel lehet.</p>}
      </aside>
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} cart={cart} />
    </div>
  );
}
