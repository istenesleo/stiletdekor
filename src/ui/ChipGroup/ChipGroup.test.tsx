/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChipGroup } from './ChipGroup';

describe('ChipGroup', () => {
  it('is a named radio group; a chip click reports its value', () => {
    const onChange = vi.fn();
    render(
      <ChipGroup
        legend="Gyakori méretek"
        options={[
          { value: 'a3', label: 'A3' },
          { value: 'a2', label: 'A2' },
          { value: 'b1', label: 'B1', disabled: true },
        ]}
        value="a3"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('group', { name: 'Gyakori méretek' })).toBeTruthy();
    expect((screen.getByRole('radio', { name: 'A3' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText('A2'));
    expect(onChange).toHaveBeenCalledWith('a2');
    expect((screen.getByRole('radio', { name: 'B1' }) as HTMLInputElement).disabled).toBe(true);
  });
});
