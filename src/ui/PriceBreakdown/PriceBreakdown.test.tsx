/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBreakdown } from './PriceBreakdown';

describe('PriceBreakdown', () => {
  it('lists the rows, the gross total and the net/VAT line', () => {
    render(
      <PriceBreakdown
        rows={[
          { label: 'Anyag · Standard frontlit', detail: '2,00 m² × 5 067 Ft', amount: 10135 },
          { label: 'Mennyiségi kedvezmény (−5%)', amount: -507, kind: 'discount' },
          { label: 'Telepítés', amountText: 'egyedi' },
        ]}
        total={9628}
        net={7581}
        vat={2047}
        note="A végleges ár eltérhet a kalkulált ártól."
      />,
    );
    const table = screen.getByRole('table', { name: 'Tételes árbontás' });
    const material = within(table).getByRole('rowheader', { name: /Anyag/ }).closest('tr')!;
    expect(material.querySelector('td')?.textContent).toBe('10\u00a0135\u00a0Ft');
    expect(within(table).getByRole('rowheader', { name: /Mennyiségi kedvezmény/ }).closest('tr')!.querySelector('td')?.textContent).toBe('\u2212507\u00a0Ft');
    expect(within(table).getByText('egyedi')).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: 'Kalkulált ár, bruttó' }).closest('tr')!.querySelector('td')?.textContent).toBe('9\u00a0628\u00a0Ft');
    expect(document.querySelector('.sd-price__netvat')?.textContent).toBe('ebből nettó 7\u00a0581\u00a0Ft, ÁFA 2\u00a0047\u00a0Ft');
  });
});
