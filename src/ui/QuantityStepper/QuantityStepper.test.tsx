/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { QuantityStepper } from './QuantityStepper';

function Harness({ initial = 1, max }: { initial?: number; max?: number }) {
  const [n, setN] = useState(initial);
  return (
    <>
      <QuantityStepper value={n} onChange={setN} max={max} />
      <output>{n}</output>
    </>
  );
}

const shown = () => document.querySelector('output')!.textContent;

describe('QuantityStepper', () => {
  it('steps with the buttons and stops at the minimum', () => {
    render(<Harness />);
    const less = screen.getByRole('button', { name: 'Eggyel kevesebb' });
    expect((less as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Eggyel több' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eggyel több' }));
    expect(shown()).toBe('3');
    expect((less as HTMLButtonElement).disabled).toBe(false);
  });

  it('accepts typing, keeps digits only and clamps on blur', () => {
    render(<Harness max={50} />);
    const input = screen.getByLabelText('Darabszám') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12a' } });
    expect(input.value).toBe('12');
    fireEvent.blur(input);
    expect(shown()).toBe('12');
    fireEvent.change(input, { target: { value: '400' } });
    fireEvent.blur(input);
    expect(shown()).toBe('50');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(shown()).toBe('1');
  });

  it('steps with the arrow keys', () => {
    render(<Harness initial={5} />);
    const input = screen.getByLabelText('Darabszám');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(shown()).toBe('6');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(shown()).toBe('4');
  });
});
