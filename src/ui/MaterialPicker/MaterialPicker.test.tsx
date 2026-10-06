/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MaterialPicker } from './MaterialPicker';

const materials = [
  {
    id: 'frontlit',
    name: 'Frontlit molinó',
    price: 5067,
    texture: 'frontlit' as const,
    specs: [
      ['Súly', '440 g/m²'],
      ['Felhasználás', 'kül- és beltér'],
    ] as const,
  },
  { id: 'mesh', name: 'Hálós molinó', price: 6337, texture: 'mesh' as const },
];

describe('MaterialPicker', () => {
  it('names each radio by material and price; the data sheet is its description', () => {
    render(<MaterialPicker materials={materials} value="frontlit" onChange={vi.fn()} />);
    const radio = screen.getByRole('radio', { name: 'Frontlit molinó 5 067 Ft/m²' }) as HTMLInputElement;
    expect(radio.checked).toBe(true);
    expect(document.getElementById(radio.getAttribute('aria-describedby')!)?.textContent).toBe('Súly440 g/m²Felhasználáskül- és beltér');
    expect(screen.getByRole('radio', { name: /Hálós molinó/ }).hasAttribute('aria-describedby')).toBe(false);
  });

  it('reports the chosen material', () => {
    const onChange = vi.fn();
    render(<MaterialPicker materials={materials} value="frontlit" onChange={onChange} />);
    fireEvent.click(screen.getByText('Hálós molinó'));
    expect(onChange).toHaveBeenCalledWith('mesh');
  });
});
