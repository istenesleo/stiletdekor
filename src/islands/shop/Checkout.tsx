// The checkout island (/penztar, client:only="react"): one page in four sections (contact, billing address, handover,
// summary and sending). The server's schema checks a field when it is left and everything on sending; then
// POST /api/orders and on to the status page (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 5.).
import { useEffect, useMemo, useRef, useState } from 'react';
import { INSTALLATION_NOTE, SHIPPING_METHODS, SHOP_PRODUCTS } from '@/domain/catalog';
import { estimateOrderReadyDate } from '@/domain/leadtime';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import { grossOf, priceCart } from '@/domain/pricing';
import { MAX_SITE_PHOTOS } from '@/domain/schemas';
import { SAVE_FAILED_MESSAGE } from '@/server/forms';
import { Checkbox } from '@/ui/Checkbox/Checkbox';
import { CheckoutSection } from '@/ui/CheckoutSection/CheckoutSection';
import { LeadTimeNote } from '@/ui/LeadTimeNote/LeadTimeNote';
import { Notice } from '@/ui/Notice/Notice';
import { OptionRow } from '@/ui/OptionRow/OptionRow';
import { OrderSubmit } from '@/ui/OrderSubmit/OrderSubmit';
import { PriceBreakdown, type PriceRow } from '@/ui/PriceBreakdown/PriceBreakdown';
import { TextField } from '@/ui/TextField/TextField';
import { WEBSHOP_HREF } from '@/ui/navigation';
import { ArtworkField } from './ArtworkField';
import { CartLines } from './CartLines';
import { useCart } from './cart-store';
import {
  CHECKOUT_DRAFT_KEY,
  CHECKOUT_FIELDS,
  CHECKOUT_TOKEN_KEY,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
  checkOrder,
  EMPTY_CHECKOUT,
  errorsFromKeys,
  fieldId,
  hasErrors,
  noErrors,
  orderBody,
} from './checkout-form';
import { cartTotals } from './price-rows';
import { useArtworkFiles } from './useArtworkFiles';
import './shop.css';

const PHOTO_WAIT_MESSAGE = 'Várja meg, amíg a helyszíni fotók feltöltődnek.';

function loadDraft(): CheckoutValues {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) ?? '{}') as Partial<CheckoutValues>;
    return { ...EMPTY_CHECKOUT, ...saved, acceptTerms: false };
  } catch {
    return EMPTY_CHECKOUT;
  }
}

/** The one-time form token, kept in the tab until the order is sent, so a resent order is not saved twice. */
function formToken(): string {
  try {
    const saved = sessionStorage.getItem(CHECKOUT_TOKEN_KEY);
    if (saved) return saved;
    const token = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_TOKEN_KEY, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** Where the customer came to the checkout from, when it is a page of this site (for measuring). */
function sameSitePath(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.origin === window.location.origin ? url.pathname : undefined;
  } catch {
    return undefined;
  }
}

export interface CheckoutProps {
  /** Goes to the status page after sending (tests replace it). */
  navigate?: (url: string) => void;
}

export function Checkout({ navigate = (url) => window.location.assign(url) }: CheckoutProps) {
  const cart = useCart();
  const [values, setValues] = useState<CheckoutValues>(loadDraft);
  const [errors, setErrors] = useState<CheckoutErrors>(noErrors);
  const [summaryShown, setSummaryShown] = useState(0);
  const [sending, setSending] = useState(false);
  const [trap, setTrap] = useState('');
  const [token] = useState(formToken);
  const summary = useRef<HTMLDivElement>(null);
  const photos = useArtworkFiles({ max: MAX_SITE_PHOTOS });

  useEffect(() => {
    try {
      const { acceptTerms: _accept, ...draft } = values;
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Works without storage too.
    }
  }, [values]);
  useEffect(() => {
    if (summaryShown > 0) summary.current?.focus();
  }, [summaryShown]);

  const extra = () => ({
    formToken: token,
    sitePhotoIds: photos.uploaded.map((photo) => photo.uploadId),
    source: sameSitePath(document.referrer),
    honlap: trap,
  });
  const set = <K extends CheckoutField>(field: K, value: CheckoutValues[K]) => setValues((current) => ({ ...current, [field]: value }));
  const check = (field: CheckoutField) => {
    const found = checkOrder(values, cart.entries, extra());
    setErrors((current) => ({ ...current, fields: { ...current.fields, [field]: found.fields[field] } }));
  };
  const show = (found: CheckoutErrors) => {
    setErrors(found);
    setSummaryShown((count) => count + 1);
  };

  const largeParcel = cart.entries.some((entry) => SHOP_PRODUCTS[entry.config.productId].parcel === 'large');
  const totals = cartTotals(cart.entries);
  const price = useMemo(() => {
    if (!values.shippingMethod || cart.entries.length === 0) return null;
    try {
      return priceCart(cart.entries, values.shippingMethod);
    } catch {
      return null;
    }
  }, [cart.entries, values.shippingMethod]);

  const submit = async () => {
    const found = checkOrder(values, cart.entries, extra());
    if (photos.busy) found.form ??= PHOTO_WAIT_MESSAGE;
    if (hasErrors(found)) {
      show(found);
      return;
    }
    setSending(true);
    setErrors(noErrors());
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody(values, cart.entries, extra())),
      });
      const body = (await response.json().catch(() => ({}))) as { statusPath?: string | null; errors?: Record<string, string>; error?: string };
      if (response.ok) {
        cart.clear();
        try {
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          sessionStorage.removeItem(CHECKOUT_TOKEN_KEY);
        } catch {
          // Nothing to clean.
        }
        navigate(body.statusPath ? `${body.statusPath}?uj=1` : '/');
        return;
      }
      show(body.errors ? errorsFromKeys(body.errors) : { ...noErrors(), form: body.error ?? SAVE_FAILED_MESSAGE });
    } catch {
      show({ ...noErrors(), form: SAVE_FAILED_MESSAGE });
    } finally {
      setSending(false);
    }
  };

  if (!cart.ready) return null;
  if (cart.entries.length === 0) {
    return (
      <Notice title="A kosár üres">
        Válasszon terméket a <a href={WEBSHOP_HREF}>webshopban</a>.
      </Notice>
    );
  }

  const field = (name: CheckoutField) => ({
    id: fieldId(name),
    value: String(values[name]),
    error: errors.fields[name],
    onChange: (event: { target: { value: string } }) => set(name, event.target.value as never),
    onBlur: () => check(name),
  });
  const summaryItems = [
    ...(errors.form ? [{ href: null, text: errors.form }] : []),
    ...CHECKOUT_FIELDS.filter((name) => errors.fields[name]).map((name) => ({ href: `#${fieldId(name)}`, text: errors.fields[name]! })),
    ...Object.entries(errors.items).map(([index, text]) => ({ href: '#penztar-tetelek', text: `${Number(index) + 1}. tétel: ${text}` })),
    ...(errors.sitePhotos ? [{ href: '#penztar-fotok', text: errors.sitePhotos }] : []),
  ];
  const method = SHIPPING_METHODS.find((m) => m.id === values.shippingMethod);
  const rows: PriceRow[] = [
    { label: `Tételek (${cart.entries.length})`, amount: totals.gross },
    !price
      ? { label: 'Átvétel', amountText: 'válasszon' }
      : price.shipping.priceOnRequest
        ? { label: price.shipping.name, amountText: 'egyedi' }
        : { label: price.shipping.name, amount: price.shipping.gross },
  ];
  const allExpress = cart.entries.every((entry) => entry.config.express);

  return (
    <form className="shop-checkout" noValidate onSubmit={(event) => event.preventDefault()}>
      {summaryShown > 0 && summaryItems.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="shop-checkout__errors">
          <p>
            <strong>Kérjük, javítsa a következőket:</strong>
          </p>
          <ul>
            {summaryItems.map((item, index) => (
              <li key={`${index}-${item.text}`}>{item.href ? <a href={item.href}>{item.text}</a> : item.text}</li>
            ))}
          </ul>
        </div>
      )}

      <CheckoutSection step={1} title="Kapcsolat">
        <TextField label="Név" required autoComplete="name" {...field('name')} />
        <TextField label="E-mail-cím" type="email" required autoComplete="email" {...field('email')} />
        <TextField label="Telefonszám" type="tel" inputMode="tel" required autoComplete="tel" {...field('phone')} />
        <TextField label="Cégnév (nem kötelező)" autoComplete="organization" {...field('company')} />
        <TextField label="Adószám (nem kötelező)" help="Cégnek, például 12345678-1-12" inputMode="numeric" {...field('taxNumber')} />
      </CheckoutSection>

      <CheckoutSection step={2} title="Számlázási cím">
        <TextField label="Irányítószám" required inputMode="numeric" autoComplete="postal-code" {...field('billingPostalCode')} />
        <TextField label="Település" required autoComplete="address-level2" {...field('billingCity')} />
        <TextField label="Utca, házszám" required autoComplete="street-address" {...field('billingAddress')} />
      </CheckoutSection>

      <CheckoutSection step={3} title="Átvétel">
        <fieldset className="shop-cfg__group" id={fieldId('shippingMethod')} tabIndex={-1}>
          <legend>Átvételi mód</legend>
          {SHIPPING_METHODS.map((m) => {
            const net = largeParcel ? m.largeParcelPriceNet : m.priceNet;
            return (
              <OptionRow
                key={m.id}
                name="shippingMethod"
                value={m.id}
                label={m.name}
                description={m.description}
                {...(net === null ? { amountText: 'egyedi' } : { amount: grossOf(net) })}
                checked={values.shippingMethod === m.id}
                onChange={() => set('shippingMethod', m.id)}
              />
            );
          })}
          {errors.fields.shippingMethod && <p className="shop-lines__error">{errors.fields.shippingMethod}</p>}
        </fieldset>
        {method?.addressLabel && (
          <>
            <Checkbox
              label={`${method.addressLabel}: ugyanaz, mint a számlázási cím`}
              checked={values.sameAddress}
              onChange={(event) => set('sameAddress', event.target.checked)}
            />
            {!values.sameAddress && (
              <>
                <TextField label={`${method.addressLabel}: irányítószám`} required inputMode="numeric" autoComplete="shipping postal-code" {...field('shippingPostalCode')} />
                <TextField label={`${method.addressLabel}: település`} required autoComplete="shipping address-level2" {...field('shippingCity')} />
                <TextField label={`${method.addressLabel}: utca, házszám`} required autoComplete="shipping street-address" {...field('shippingAddress')} />
              </>
            )}
          </>
        )}
        {values.shippingMethod === 'telepites' && (
          <>
            <Notice>{INSTALLATION_NOTE}</Notice>
            <Checkbox
              label="Helyszíni felmérést kérek"
              description="Gyártás előtt a helyszínen ellenőrizzük a méreteket."
              checked={values.surveyRequested}
              onChange={(event) => set('surveyRequested', event.target.checked)}
            />
            <div id="penztar-fotok" className="shop-cfg__group">
              <ArtworkField files={photos} title="Fotó a helyszínről (nem kötelező)" hint={`JPG, PNG, HEIC · legfeljebb ${MAX_SITE_PHOTOS} fotó`} />
              {errors.sitePhotos && <p className="shop-lines__error">{errors.sitePhotos}</p>}
            </div>
          </>
        )}
      </CheckoutSection>

      <CheckoutSection step={4} title="Összesítő és elküldés">
        <div id="penztar-tetelek">
          <CartLines entries={cart.entries} errors={errors.items} />
        </div>
        <PriceBreakdown
          rows={rows}
          total={price ? price.grossTotal : totals.gross}
          net={price ? price.netTotal : totals.net}
          vat={price ? price.vatTotal : totals.vat}
          note={FINAL_PRICE_NOTICE}
        />
        <LeadTimeNote readyBy={estimateOrderReadyDate(new Date(), { express: allExpress })} express={allExpress} />
        <TextField label="Megjegyzés (nem kötelező)" multiline {...field('note')} />
        <div className="shop-checkout__trap" aria-hidden="true">
          <label>
            Honlap
            <input name="honlap" tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
          </label>
        </div>
        <div id={fieldId('acceptTerms')} tabIndex={-1}>
          <OrderSubmit
            accepted={values.acceptTerms}
            onAcceptedChange={(accepted) => set('acceptTerms', accepted)}
            acceptLabel={
              <>
                Elfogadom az <a href="/aszf">ÁSZF-et</a> és az <a href="/adatkezeles">adatkezelési tájékoztatót</a>
              </>
            }
            error={errors.fields.acceptTerms}
            loading={sending}
            onSubmit={() => void submit()}
          />
        </div>
      </CheckoutSection>
    </form>
  );
}
