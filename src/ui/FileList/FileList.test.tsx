/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileList, formatFileSize } from './FileList';

describe('formatFileSize', () => {
  it.each([
    [512, '1 kB'],
    [830_000, '830 kB'],
    [2_400_000, '2,4 MB'],
    [148_000_000, '148 MB'],
  ])('%d bytes → %s', (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text.replace(/ (?=[kM]B)/, ' '));
  });
});

describe('FileList', () => {
  it('lists name, size, what was read and the status; removes by id', () => {
    const onRemove = vi.fn();
    render(
      <FileList
        items={[
          { id: 'a', name: 'molino-200x100.pdf', size: 2_400_000, detail: '2000×1000 mm · vektoros', status: 'ok', statusText: 'Méret felismerve' },
          { id: 'b', name: 'logo.png', status: 'error', statusText: 'Nem olvasható' },
        ]}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('2,4 MB · 2000×1000 mm · vektoros')).toBeTruthy();
    expect(screen.getByText('Méret felismerve')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fájl törlése: logo.png' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });
});
