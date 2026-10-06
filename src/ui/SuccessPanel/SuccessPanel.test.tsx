/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SuccessPanel } from './SuccessPanel';

describe('SuccessPanel', () => {
  it('confirms with the reference and the next steps, in order', () => {
    render(
      <SuccessPanel
        title="Megkaptuk az ajánlatkérését"
        reference="AK-2026-0142"
        nextSteps={['Átnézzük a kérését.', 'Egy munkanapon belül visszahívjuk.']}
        note="A végleges árajánlat eltérhet a kalkulált ártól."
      />,
    );
    const panel = screen.getByRole('region', { name: 'Megkaptuk az ajánlatkérését' });
    expect(panel.querySelector('.sd-success__ref')?.textContent).toBe('AzonosítóAK-2026-0142');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Átnézzük a kérését.',
      'Egy munkanapon belül visszahívjuk.',
    ]);
    expect(screen.getByText('A végleges árajánlat eltérhet a kalkulált ártól.')).toBeTruthy();
  });

  it('moves focus to its title when asked, so the confirmation is announced', () => {
    render(<SuccessPanel title="Megkaptuk a rendelését" autoFocus />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Megkaptuk a rendelését' }));
  });
});
