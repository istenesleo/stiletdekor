/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getQuoteType } from '@/domain/catalog';
import QuoteWizard from './QuoteWizard';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const TODAY = '2026-10-09';
const steps = (c: HTMLElement) => [...c.querySelectorAll('fieldset[data-step]')].map((s) => s.hasAttribute('hidden'));

beforeEach(() => sessionStorage.clear());

describe('QuoteWizard', () => {
  it('turns the form into steps, and moves on only when the step is filled in', async () => {
    const { container } = render(<QuoteWizard type={getQuoteType('egyeb')} token={TOKEN} today={TODAY} />);
    expect(steps(container)).toEqual([false, true, true]);
    expect(screen.getByText(/1\. lépés a 3-ból/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
    expect(steps(container)).toEqual([false, true, true]);
    fireEvent.change(container.querySelector('textarea[name="f_leiras"]')!, { target: { value: 'Ajtófelirat a műhelyre.' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(steps(container)).toEqual([true, false, true]);
    fireEvent.click(screen.getByRole('button', { name: 'Vissza' }));
    expect(steps(container)).toEqual([false, true, true]);
  });

  it('applies the job type rules before moving on: a "one of" group', async () => {
    const { container } = render(<QuoteWizard type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    fireEvent.change(container.querySelector('input[name="f_betumagassagCm"]')!, { target: { value: '40' } });
    fireEvent.click(container.querySelector('input[name="f_anyag"][value="plexi"]')!);
    fireEvent.click(container.querySelector('input[name="f_vilagitas"][value="nincs"]')!);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(screen.getByRole('alert').textContent).toContain('Adja meg a felirat szövegét, vagy töltse fel a logót.');
    expect(steps(container)).toEqual([false, true, true]);
    fireEvent.click(container.querySelector('input[name="f_logo__email"]')!);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(steps(container)).toEqual([true, false, true]);
  });

  it('shows a conditional field only when its answer is chosen', () => {
    const { container } = render(<QuoteWizard type={getQuoteType('autofoliazas')} token={TOKEN} today={TODAY} />);
    const wrap = () => container.querySelector('[data-field="grafikaFajlok"]')!;
    expect(wrap().hasAttribute('hidden')).toBe(true);
    fireEvent.click(container.querySelector('input[name="f_grafika"][value="van"]')!);
    expect(wrap().hasAttribute('hidden')).toBe(false);
  });

  it('keeps a draft in the browser, and shows every step at once after a server error', () => {
    const type = getQuoteType('egyeb');
    const first = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} />);
    fireEvent.change(first.container.querySelector('textarea[name="f_leiras"]')!, { target: { value: 'Vázlat' } });
    first.unmount();
    const again = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} />);
    expect(again.container.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!.value).toBe('Vázlat');
    again.unmount();
    const withError = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} errors={{ email: 'Adja meg az e-mail-címét.' }} />);
    expect(steps(withError.container)).toEqual([false, false, false]);
    expect(screen.queryByText(/lépés a 3-ból/)).toBeNull();
  });
});
