/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnitField } from './UnitField';

describe('UnitField', () => {
  it('is a decimal text input with its unit beside it', () => {
    const { container } = render(<UnitField label="Szélesség" unit="cm" defaultValue="29,7" />);
    const input = screen.getByLabelText('Szélesség') as HTMLInputElement;
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.value).toBe('29,7');
    expect(container.querySelector('.sd-unit__suffix')?.textContent).toBe('cm');
  });
});
