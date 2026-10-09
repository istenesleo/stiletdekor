/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getQuoteType } from '@/domain/catalog';
import { QuoteForm } from './QuoteForm';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const TODAY = '2026-10-09';

describe('QuoteForm', () => {
  it('is one plain form with the three steps, all showing without JavaScript', () => {
    const { container } = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    const form = container.querySelector('form')!;
    expect([form.getAttribute('method'), form.getAttribute('action')]).toEqual(['post', null]);
    const steps = [...container.querySelectorAll('fieldset[data-step]')];
    expect(steps.map((s) => s.querySelector('legend')?.textContent)).toEqual(['1. Részletek', '2. Helyszín és határidő', '3. Kapcsolat']);
    expect(steps.every((s) => !s.hasAttribute('hidden'))).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="token"]')!.value).toBe(TOKEN);
    expect(screen.getByRole('button', { name: 'Ajánlatkérés elküldése' })).toBeTruthy();
  });

  it('asks the job type questions with fitting controls', () => {
    const { container } = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    expect(container.querySelector('input[name="f_feliratSzoveg"]')?.getAttribute('type')).toBe('text');
    expect(container.querySelector('input[name="f_betumagassagCm"]')?.getAttribute('inputmode')).toBe('decimal');
    const anyag = [...container.querySelectorAll<HTMLInputElement>('input[name="f_anyag"]')];
    expect(anyag.map((r) => r.type)).toEqual(['radio', 'radio', 'radio', 'radio']);
    expect(anyag.every((r) => r.required)).toBe(true);
    expect(container.querySelector('input[name="f_logo__email"]')?.getAttribute('type')).toBe('checkbox');
    const deadline = container.querySelector<HTMLInputElement>('input[name="deadline"]')!;
    expect([deadline.type, deadline.min, String(deadline.required)]).toEqual(['date', TODAY, 'true']);
    expect(container.querySelector<HTMLInputElement>('input[name="location"]')!.required).toBe(true);
  });

  it('uses a list for many options, checkboxes for several answers, and no required address where work is not on site', () => {
    const ceger = render(<QuoteForm type={getQuoteType('ceger')} token={TOKEN} today={TODAY} />).container;
    expect(ceger.querySelector('select[name="f_rogzitesiFelulet"]')).not.toBeNull();
    const kirakat = render(<QuoteForm type={getQuoteType('kirakat')} token={TOKEN} today={TODAY} />).container;
    expect([...kirakat.querySelectorAll<HTMLInputElement>('input[name="f_foliaTipus"]')].map((c) => c.type)).toEqual([
      'checkbox',
      'checkbox',
      'checkbox',
      'checkbox',
    ]);
    const harom = render(<QuoteForm type={getQuoteType('3d-nyomtatas')} token={TOKEN} today={TODAY} />).container;
    expect(harom.querySelector<HTMLInputElement>('input[name="location"]')!.required).toBe(false);
  });

  it('shows a conditional field with its condition, and marks the rule for the page script', () => {
    const { container } = render(<QuoteForm type={getQuoteType('autofoliazas')} token={TOKEN} today={TODAY} />);
    const wrap = container.querySelector<HTMLElement>('[data-field="grafikaFajlok"]')!;
    expect(wrap.hasAttribute('hidden')).toBe(false);
    expect(JSON.parse(wrap.dataset.visibleWhen!)).toEqual({ field: 'grafika', equals: ['van'] });
    expect(wrap.querySelector('[data-condition]')?.textContent).toContain('Csak akkor töltse ki');
  });

  it('shows what was typed, the messages and a summary that links to the fields', () => {
    render(
      <QuoteForm
        type={getQuoteType('betuk')}
        token={TOKEN}
        today={TODAY}
        values={{ f_betumagassagCm: '40', f_anyag: 'alu', name: 'Minta Mária' }}
        errors={{ f_feliratSzoveg: 'Adja meg a felirat szövegét, vagy töltse fel a logót.', email: 'Adja meg az e-mail-címét.' }}
      />,
    );
    const summary = screen.getByRole('alert');
    expect(within(summary).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#ak-feliratSzoveg', '#ak-email']);
    expect(screen.getByDisplayValue('40').getAttribute('name')).toBe('f_betumagassagCm');
    expect(document.querySelector<HTMLInputElement>('input[name="f_anyag"][value="alu"]')!.checked).toBe(true);
    expect(document.getElementById('ak-email')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('carries the hidden parts the page script turns into steps', () => {
    const { container } = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    expect(container.querySelector('[data-wizard-stepper]')?.hasAttribute('hidden')).toBe(true);
    const nav = container.querySelector('[data-wizard-nav]')!;
    expect(nav.hasAttribute('hidden')).toBe(true);
    expect([...nav.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Vissza', 'Tovább']);
    expect(JSON.parse(container.querySelector<HTMLElement>('[data-step="0"]')!.dataset.requireOneOf!)).toEqual([
      { names: ['f_feliratSzoveg', 'f_logo__email'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' },
    ]);
    const form = container.querySelector<HTMLFormElement>('form')!;
    expect([form.dataset.quoteType, form.dataset.answered]).toEqual(['betuk', undefined]);
    const answered = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} values={{ name: 'Minta Mária' }} />);
    expect(answered.container.querySelector<HTMLFormElement>('form')!.dataset.answered).toBe('true');
  });
});
