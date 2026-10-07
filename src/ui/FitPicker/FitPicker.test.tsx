/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FIT_MODES } from '@/domain/preflight';
import { FitPicker } from './FitPicker';

describe('FitPicker', () => {
  it('uses the domain wording and reports the mode', () => {
    const onChange = vi.fn();
    render(<FitPicker value="fill" onChange={onChange} />);
    expect((screen.getByRole('radio', { name: new RegExp(FIT_MODES.fill.label.replace(/[()]/g, '.')) }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText(FIT_MODES.fit.label));
    expect(onChange).toHaveBeenCalledWith('fit');
  });
});
