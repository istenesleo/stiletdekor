/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('opens as a labelled dialog and closes from its button', () => {
    const onClose = vi.fn();
    const { rerender, container } = render(
      <Drawer open={false} onClose={onClose} title="Kosár">
        Tételek
      </Drawer>,
    );
    const dialog = container.querySelector('dialog')!;
    expect(dialog.open).toBe(false);
    rerender(
      <Drawer open onClose={onClose} title="Kosár" footer={<p>Összesen</p>}>
        Tételek
      </Drawer>,
    );
    expect(dialog.open).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Kosár' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape and on a click outside the panel', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Drawer open onClose={onClose} title="Kosár">
        Tételek
      </Drawer>,
    );
    const dialog = container.querySelector('dialog')!;
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    fireEvent.click(dialog);
    fireEvent.click(screen.getByText('Tételek'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
