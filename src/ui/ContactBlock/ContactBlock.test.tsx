/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactBlock } from './ContactBlock';

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
}

afterEach(() => {
  setClipboard();
  vi.useRealTimers();
});

describe('ContactBlock', () => {
  it('offers calling, writing and the map, with the workshop data by default', () => {
    render(<ContactBlock />);
    expect(screen.getByRole('link', { name: 'Hívás' }).getAttribute('href')).toBe('tel:+36705385030');
    expect(screen.getByRole('link', { name: 'Levél írása' }).getAttribute('href')).toBe('mailto:stiletdekor@gmail.com');
    const map = screen.getByRole('link', { name: 'Térkép (új lapon nyílik)' });
    expect(map.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Budapest%2C%20Schweidel%20J%C3%B3zsef%20u.%201%E2%80%933.',
    );
    expect(map.getAttribute('target')).toBe('_blank');
    expect(screen.getByText('H–P 8:00–17:00')).toBeTruthy();
  });

  it('copies to the clipboard, says so, and resets the button after 2 seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    render(<ContactBlock />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Másolás: telefonszám' }));
    });
    expect(writeText).toHaveBeenCalledWith('+36 70 538 5030');
    expect(screen.getByRole('status').textContent).toBe('A telefonszámot a vágólapra másoltuk.');
    expect(screen.getByRole('button', { name: 'Másolva: telefonszám' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Másolás: telefonszám' })).toBeTruthy();
  });

  it('selects the text when there is no clipboard', async () => {
    setClipboard();
    render(<ContactBlock />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Másolás: e-mail-cím' }));
    });
    expect(window.getSelection()?.toString()).toBe('stiletdekor@gmail.com');
    expect(screen.getByRole('status').textContent).toBe('Az e-mail-címet kijelöltük, most már kimásolhatja.');
  });

  it('leaves out the map and the opening hours when asked', () => {
    render(<ContactBlock mapHref={null} openingHours={null} />);
    expect(screen.queryByRole('link', { name: /Térkép/ })).toBeNull();
    expect(screen.queryByText('Nyitvatartás')).toBeNull();
  });
});
