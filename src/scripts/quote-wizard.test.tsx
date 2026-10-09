/** @vitest-environment jsdom */
import { fireEvent } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { getQuoteType, type QuoteTypeId } from '@/domain/catalog';
import type { QuoteFormValues } from '@/domain/quote-form';
import { QuoteForm } from '@/ui/QuoteForm/QuoteForm';
import { initQuoteWizard } from './quote-wizard';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';

/** The page as the server sends it, then the script, as on the quote page. */
function page(type: QuoteTypeId, values?: QuoteFormValues): HTMLFormElement {
  document.body.innerHTML = renderToStaticMarkup(<QuoteForm type={getQuoteType(type)} token={TOKEN} today="2026-10-09" values={values} />);
  const form = document.querySelector<HTMLFormElement>('form')!;
  initQuoteWizard(form, { draftKey: `stilet-ajanlat-${type}` });
  return form;
}

const hidden = () => [...document.querySelectorAll('[data-step]')].map((s) => s.hasAttribute('hidden'));
const button = (label: string) => [...document.querySelectorAll('button')].find((b) => b.textContent === label)!;

beforeEach(() => sessionStorage.clear());

describe('initQuoteWizard', () => {
  it('shows one step at a time, with the step bar, and moves on only when the step is filled in', () => {
    const form = page('egyeb');
    expect(hidden()).toEqual([false, true, true]);
    expect(document.querySelector('[data-wizard-stepper]')!.hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('.sd-steps__count')!.textContent).toContain('1. lépés a 3-ból');
    expect(document.querySelector('[data-wizard-send]')!.hasAttribute('hidden')).toBe(true);
    fireEvent.click(button('Tovább'));
    expect(hidden()).toEqual([false, true, true]);
    form.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!.value = 'Ajtófelirat a műhelyre.';
    fireEvent.click(button('Tovább'));
    expect(hidden()).toEqual([true, false, true]);
    expect(document.querySelector('.sd-steps__count')!.textContent).toContain('2. lépés a 3-ból');
    expect(document.activeElement?.tagName).toBe('LEGEND');
    fireEvent.click(button('Vissza'));
    expect(hidden()).toEqual([false, true, true]);
  });

  it('shows the send button on the last step only', () => {
    const form = page('egyeb');
    form.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!.value = 'Ajtófelirat.';
    fireEvent.click(button('Tovább'));
    form.querySelector<HTMLInputElement>('input[name="deadline"]')!.value = '2026-11-15';
    fireEvent.click(button('Tovább'));
    expect(hidden()).toEqual([true, true, false]);
    expect(document.querySelector('[data-wizard-send]')!.hasAttribute('hidden')).toBe(false);
    expect(button('Tovább').hasAttribute('hidden')).toBe(true);
  });

  it('applies the job type "one of" rule before moving on, a file sent by e-mail counting', () => {
    const form = page('betuk');
    form.querySelector<HTMLInputElement>('input[name="f_betumagassagCm"]')!.value = '40';
    form.querySelector<HTMLInputElement>('input[name="f_anyag"][value="plexi"]')!.checked = true;
    form.querySelector<HTMLInputElement>('input[name="f_vilagitas"][value="nincs"]')!.checked = true;
    fireEvent.click(button('Tovább'));
    const error = document.querySelector('[data-wizard-error]')!;
    expect(error.hasAttribute('hidden')).toBe(false);
    expect(error.textContent).toBe('Adja meg a felirat szövegét, vagy töltse fel a logót.');
    expect(hidden()).toEqual([false, true, true]);
    fireEvent.click(form.querySelector('input[name="f_logo__email"]')!);
    expect(error.hasAttribute('hidden')).toBe(true);
    fireEvent.click(button('Tovább'));
    expect(hidden()).toEqual([true, false, true]);
  });

  it('asks for a required multiple choice', () => {
    const form = page('kirakat');
    form.querySelector<HTMLInputElement>('input[name="f_feluletM2"]')!.value = '12';
    fireEvent.click(button('Tovább'));
    expect(document.querySelector('[data-wizard-error]')!.textContent).toBe('Kérjük, válasszon a lehetőségek közül.');
    fireEvent.click(form.querySelector('input[name="f_foliaTipus"][value="dekor"]')!);
    fireEvent.click(button('Tovább'));
    expect(hidden()).toEqual([true, false, true]);
  });

  it('shows a conditional field only when its answer is chosen, without the written condition', () => {
    const form = page('autofoliazas');
    const wrap = form.querySelector('[data-field="grafikaFajlok"]')!;
    expect(wrap.hasAttribute('hidden')).toBe(true);
    expect(wrap.querySelector('[data-condition]')!.hasAttribute('hidden')).toBe(true);
    fireEvent.click(form.querySelector('input[name="f_grafika"][value="van"]')!);
    expect(wrap.hasAttribute('hidden')).toBe(false);
  });

  it('keeps a draft until the form is sent, and shows every step after a server error', () => {
    let form = page('egyeb');
    const text = form.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!;
    text.value = 'Vázlat';
    fireEvent.input(text);
    form = page('egyeb');
    expect(form.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!.value).toBe('Vázlat');
    fireEvent.submit(form);
    expect(sessionStorage.getItem('stilet-ajanlat-egyeb')).toBeNull();
    page('egyeb', { name: 'Minta Mária' });
    expect(hidden()).toEqual([false, false, false]);
    expect(document.querySelector('[data-wizard-stepper]')!.hasAttribute('hidden')).toBe(true);
  });
});
