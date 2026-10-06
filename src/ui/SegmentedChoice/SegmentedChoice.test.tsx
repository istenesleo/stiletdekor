/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FIT_MODES } from '@/domain/preflight';
import { FitPicker, SegmentedChoice } from './SegmentedChoice';

describe('SegmentedChoice', () => {
  it('selects one option at a time', () => {
    const onChange = vi.fn();
    render(
      <SegmentedChoice
        legend="A fájl méretaránya"
        options={[
          { value: '1', label: '1:1' },
          { value: '10', label: '1:10' },
          { value: 'x', label: 'Egyéb' },
        ]}
        value="1"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('1:10'));
    expect(onChange).toHaveBeenCalledWith('10');
  });
});

describe('FitPicker', () => {
  it('uses the domain wording and reports the mode', () => {
    const onChange = vi.fn();
    render(<FitPicker value="fill" onChange={onChange} />);
    expect((screen.getByRole('radio', { name: new RegExp(FIT_MODES.fill.label.replace(/[()]/g, '.')) }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText(FIT_MODES.fit.label));
    expect(onChange).toHaveBeenCalledWith('fit');
  });
});
