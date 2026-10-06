/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { elativeSuffix, Stepper } from './Stepper';

const STEPS = ['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat'] as const;

describe('Stepper', () => {
  it('says where the visitor is and marks the current step', () => {
    const { container } = render(<Stepper steps={STEPS} current={1} />);
    expect(screen.getByRole('navigation', { name: 'Lépések' })).toBeTruthy();
    expect(container.querySelector('.sd-steps__count')?.textContent).toBe('2. lépés a 4-ből · Részletek');
    const current = container.querySelector('[aria-current="step"]');
    expect(current?.textContent).toBe('2Részletek');
    expect([...container.querySelectorAll('li')].map((li) => li.dataset.state)).toEqual(['done', 'current', 'todo', 'todo']);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('lets the visitor go back to a reached step, not forward', () => {
    const onStepClick = vi.fn();
    render(<Stepper steps={STEPS} current={1} reached={2} onStepClick={onStepClick} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['1Típus', '3Helyszín és fotók']);
    fireEvent.click(buttons[0]!);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });
});

describe('elativeSuffix', () => {
  it('follows how the number is read', () => {
    const table = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 20, 30, 40, 60, 80, 100, 1000].map((n) => `${n}-${elativeSuffix(n)}`);
    expect(table).toEqual([
      '1-ből', '2-ből', '3-ból', '4-ből', '5-ből', '6-ból', '7-ből', '8-ból', '9-ből', '10-ből',
      '12-ből', '13-ból', '20-ból', '30-ból', '40-ből', '60-ból', '80-ból', '100-ból', '1000-ből',
    ]);
  });
});
