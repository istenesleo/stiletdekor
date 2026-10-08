/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QUOTE_TYPES } from '@/domain/catalog';
import { HONEYPOT_FIELD } from '@/server/callback/submit';
import { CallbackForm } from './CallbackForm';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';

describe('CallbackForm', () => {
  it('posts to /visszahivas with the token, the source, and the four fields', () => {
    const { container } = render(<CallbackForm token={TOKEN} source="/kapcsolat#visszahivas" />);
    const form = container.querySelector('form')!;
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe('/visszahivas');
    expect(container.querySelector<HTMLInputElement>('input[name="token"]')!.value).toBe(TOKEN);
    expect(container.querySelector<HTMLInputElement>('input[name="source"]')!.value).toBe('/kapcsolat#visszahivas');
    const name = screen.getByLabelText(/^Név/) as HTMLInputElement;
    expect(name.required).toBe(true);
    expect(name.getAttribute('autocomplete')).toBe('name');
    const phone = screen.getByLabelText(/^Telefonszám/) as HTMLInputElement;
    expect([phone.type, phone.getAttribute('autocomplete'), phone.getAttribute('inputmode'), String(phone.required)]).toEqual([
      'tel',
      'tel',
      'tel',
      'true',
    ]);
    expect(screen.getByLabelText('Munka típusa (nem kötelező)').tagName).toBe('SELECT');
    expect((screen.getByLabelText('Röviden, miről van szó (nem kötelező)') as HTMLInputElement).maxLength).toBe(300);
    expect(screen.getByRole('button', { name: 'Visszahívást kérek' }).getAttribute('type')).toBe('submit');
    expect(screen.getByRole('link', { name: 'Adatkezelési tájékoztató' }).getAttribute('href')).toBe('/adatkezeles');
  });

  it('offers every quote type and "Még nem tudom"', () => {
    render(<CallbackForm token={TOKEN} />);
    const options = within(screen.getByLabelText('Munka típusa (nem kötelező)')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Válasszon, ha tudja', ...QUOTE_TYPES.map((t) => t.name), 'Még nem tudom']);
  });

  it('has a trap field that people never reach', () => {
    const { container } = render(<CallbackForm token={TOKEN} />);
    const trap = container.querySelector<HTMLInputElement>(`input[name="${HONEYPOT_FIELD}"]`)!;
    expect(trap.tabIndex).toBe(-1);
    expect(trap.getAttribute('autocomplete')).toBe('off');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows what was typed, the messages, and a summary that links to the fields', () => {
    render(
      <CallbackForm
        token={TOKEN}
        values={{ name: '', phone: '123', jobType: 'ceger', message: 'Tábla' }}
        errors={{ name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg.' }}
      />,
    );
    const summary = screen.getByRole('alert');
    expect(within(summary).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Adja meg a nevét.', '#vh-name'],
      ['Kérjük, érvényes telefonszámot adjon meg.', '#vh-phone'],
    ]);
    expect((screen.getByLabelText(/^Telefonszám/) as HTMLInputElement).value).toBe('123');
    expect(screen.getByLabelText(/^Telefonszám/).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByDisplayValue('Cégér, reklámtábla').getAttribute('name')).toBe('jobType');
  });

  it('shows a message about the whole form, and keeps two forms on a page apart', () => {
    const { container } = render(<CallbackForm token={TOKEN} idPrefix="kapcsolat" formError="Most nem sikerült elküldeni." />);
    expect(within(screen.getByRole('alert')).getByText('Most nem sikerült elküldeni.')).toBeTruthy();
    expect(container.querySelector('#kapcsolat-name')).not.toBeNull();
  });
});
