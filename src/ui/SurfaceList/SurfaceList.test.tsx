/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceList } from './SurfaceList';

const surfaces = [
  { id: 'a', pages: [1, 3], widthMm: 1200, heightMm: 2100, count: 2, label: 'Ajtóüveg' },
  { id: 'b', pages: [2], widthMm: 2400, heightMm: 2100, count: 1 },
  { id: 'c', pages: [4], widthMm: 600, heightMm: 400, count: 1, skipped: true },
];

describe('SurfaceList', () => {
  it('summarises pages and surfaces and totals only what is ordered, per set', () => {
    render(<SurfaceList surfaces={surfaces} sets={2} onSetsChange={vi.fn()} onToggleSkip={vi.fn()} />);
    expect(screen.getByText('4 oldal, 3 különböző felület')).toBeTruthy();
    expect(document.querySelector('.sd-surface__meta')?.textContent).toBe('1., 3. oldal · 1\u00a0200×2\u00a0100\u00a0mm · 2\u00a0db/készlet · 5,04\u00a0m²');
    // (1.2 × 2.1 × 2 + 2.4 × 2.1) × 2 sets = 20.16 m², 6 pieces
    expect(document.querySelector('.sd-surfaces__total')?.textContent).toBe('Összesen 6\u00a0db, 20,16\u00a0m²');
  });

  it('skips and takes back a surface; changes the set count', () => {
    const onToggleSkip = vi.fn();
    const onSetsChange = vi.fn();
    render(<SurfaceList surfaces={surfaces} sets={1} onSetsChange={onSetsChange} onToggleSkip={onToggleSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Visszaveszem' }));
    expect(onToggleSkip).toHaveBeenCalledWith('c');
    fireEvent.click(screen.getByRole('button', { name: 'Eggyel több' }));
    expect(onSetsChange).toHaveBeenCalledWith(2);
  });
});
