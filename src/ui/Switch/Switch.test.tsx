/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is a named switch with its consequence as description', () => {
    const onChange = vi.fn();
    render(<Switch label="Expressz gyártás" description="1 munkanap, +30%" onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Expressz gyártás' });
    expect(document.getElementById(sw.getAttribute('aria-describedby')!)?.textContent).toBe('1 munkanap, +30%');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledOnce();
  });
});
