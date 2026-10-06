/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OptionRow } from './OptionRow';

describe('OptionRow', () => {
  it('shows the unit rate and the amount for the chosen size', () => {
    const { container } = render(<OptionRow name="edge" label="Szegés + ringli" rate={445} rateUnit="fm" amount={2670} />);
    expect(container.querySelector('.sd-optrow__rate')?.textContent).toBe('+445 Ft/fm');
    expect(container.querySelector('.sd-optrow__amount')?.textContent).toBe('2 670 Ft');
  });

  it('says "felár nélkül" for a free option', () => {
    render(<OptionRow name="edge" label="Méretre vágás" rate={0} />);
    expect(screen.getByText('felár nélkül')).toBeTruthy();
  });

  it('is a radio by default, a checkbox on request, selectable from anywhere on the row', () => {
    const onChange = vi.fn();
    const { rerender } = render(<OptionRow name="edge" label="Ringli" onChange={onChange} />);
    fireEvent.click(screen.getByText('Ringli'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('radio')).toBeTruthy();
    rerender(<OptionRow label="Kontúrvágás" type="checkbox" />);
    expect(screen.getByRole('checkbox', { name: /Kontúrvágás/ })).toBeTruthy();
  });
});
