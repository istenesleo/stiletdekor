/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartLine } from './CartLine';

describe('CartLine', () => {
  it('shows what the item is and its gross price; removes it', () => {
    const onRemove = vi.fn();
    const { container } = render(
      <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 2 db" price={25610} product="molino" onRemove={onRemove} />,
    );
    expect(container.querySelector('.sd-cartline__price')?.textContent).toBe('25\u00a0610\u00a0Ft');
    expect(container.querySelector('.sd-cartline__thumb svg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tétel törlése: Molinó · Standard frontlit' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
