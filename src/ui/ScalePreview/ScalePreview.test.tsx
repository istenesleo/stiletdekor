/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScalePreview } from './ScalePreview';

describe('ScalePreview', () => {
  it('names the size and the figure, and dimensions the product in millimetres', () => {
    const { container } = render(<ScalePreview widthCm={200} heightCm={100} />);
    expect(screen.getByRole('img', { name: 'Valós léptékű előnézet: 200×100 cm, mellette 180 cm magas alak' })).toBeTruthy();
    const labels = [...container.querySelectorAll('.sd-scale__dim text')].map((t) => t.textContent);
    expect(labels).toEqual(['1\u00a0800\u00a0mm', '2\u00a0000\u00a0mm', '1\u00a0000\u00a0mm']);
  });

  it('puts the artwork in the board with the chosen fit', () => {
    const { container, rerender } = render(<ScalePreview widthCm={85} heightCm={200} imageUrl="data:image/png;base64,AA==" />);
    expect(container.querySelector('image')?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
    rerender(<ScalePreview widthCm={85} heightCm={200} imageUrl="data:image/png;base64,AA==" fit="fit" />);
    expect(container.querySelector('image')?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });

  it('draws marks, a stand, and stands the product on the floor', () => {
    const { container } = render(<ScalePreview widthCm={60} heightCm={40} marks={[{ x: 2, y: 2 }, { x: 58, y: 2 }]} stand />);
    expect(container.querySelectorAll('.sd-scale__mark')).toHaveLength(2);
    expect(container.querySelector('.sd-scale__stand')).toBeTruthy();
    const board = container.querySelector('.sd-scale__board')!;
    expect(Number(board.getAttribute('y')) + Number(board.getAttribute('height'))).toBeCloseTo(-9, 6);
  });
});
