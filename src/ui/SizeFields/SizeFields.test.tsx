/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SizeFields } from './SizeFields';

const props = { width: '200', height: '100', onWidthChange: vi.fn(), onHeightChange: vi.fn() };

describe('SizeFields', () => {
  it('has a labeled field for each side and reports typing', () => {
    const onWidthChange = vi.fn();
    render(<SizeFields {...props} onWidthChange={onWidthChange} />);
    expect(screen.getByRole('group', { name: 'Méret' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Szélesség'), { target: { value: '29,7' } });
    expect(onWidthChange).toHaveBeenCalledWith('29,7');
    expect((screen.getByLabelText('Magasság') as HTMLInputElement).value).toBe('100');
  });

  it('swaps only when a handler is given', () => {
    const onSwap = vi.fn();
    const { rerender } = render(<SizeFields {...props} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SizeFields {...props} onSwap={onSwap} />);
    fireEvent.click(screen.getByRole('button', { name: 'Szélesség és magasság cseréje' }));
    expect(onSwap).toHaveBeenCalledOnce();
  });

  it('says when the size came from the file and links the error to both fields', () => {
    render(<SizeFields {...props} fromFile error="A szélesség 10 és 500 cm között lehet." />);
    expect(screen.getByText('A méret a fájlból')).toBeTruthy();
    for (const name of ['Szélesség', 'Magasság']) {
      const input = screen.getByLabelText(name);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('A szélesség 10 és 500 cm között lehet.');
    }
  });
});
