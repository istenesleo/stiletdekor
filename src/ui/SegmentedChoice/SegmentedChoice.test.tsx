/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedChoice } from './SegmentedChoice';

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
