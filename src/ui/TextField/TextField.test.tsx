/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('connects label, help and error to the input', () => {
    render(<TextField label="Telefon" type="tel" autoComplete="tel" required help="Erre a számra hívjuk vissza." error="Adja meg a telefonszámát." />);
    const input = screen.getByLabelText(/Telefon/);
    expect(input.getAttribute('type')).toBe('tel');
    expect(input.hasAttribute('required')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['Erre a számra hívjuk vissza.', 'Adja meg a telefonszámát.']);
  });

  it('has no invalid state or description without them', () => {
    render(<TextField label="Név" />);
    const input = screen.getByLabelText('Név');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('can be a textarea and reports changes', () => {
    const onChange = vi.fn();
    render(<TextField label="Megjegyzés" multiline onChange={onChange} />);
    const area = screen.getByLabelText('Megjegyzés');
    expect(area.tagName).toBe('TEXTAREA');
    fireEvent.change(area, { target: { value: 'Hétfőn délelőtt jó.' } });
    expect(onChange).toHaveBeenCalledOnce();
  });
});
