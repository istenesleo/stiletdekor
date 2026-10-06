/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles from its label', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Helyszíni felmérést kérek" onChange={onChange} />);
    fireEvent.click(screen.getByText('Helyszíni felmérést kérek'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('describes itself and reports its error', () => {
    render(
      <Checkbox
        label="Elfogadom az ÁSZF-et"
        description="A rendelés elküldése még nem jár fizetési kötelezettséggel."
        error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés."
        required
      />,
    );
    const box = screen.getByRole('checkbox', { name: 'Elfogadom az ÁSZF-et' });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
  });
});
