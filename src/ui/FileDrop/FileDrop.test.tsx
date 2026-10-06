/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileDrop } from './FileDrop';

const pdf = () => new File(['%PDF-1.7'], 'molino.pdf', { type: 'application/pdf' });

describe('FileDrop', () => {
  it('passes chosen files on', () => {
    const onFiles = vi.fn();
    render(<FileDrop onFiles={onFiles} accept=".pdf" hint="PDF · legfeljebb 200 MB" />);
    const input = screen.getByLabelText('Fájl kiválasztása');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('PDF · legfeljebb 200 MB');
    fireEvent.change(input, { target: { files: [pdf()] } });
    expect(onFiles.mock.calls[0]![0][0].name).toBe('molino.pdf');
  });

  it('highlights while dragging and takes the dropped file', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDrop onFiles={onFiles} />);
    const zone = container.querySelector('.sd-drop')!;
    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    expect(zone.getAttribute('data-state')).toBe('dragging');
    expect(screen.getByText('Engedje el a fájlt')).toBeTruthy();
    fireEvent.drop(zone, { dataTransfer: { files: [pdf(), pdf()] } });
    expect(zone.getAttribute('data-state')).toBe('idle');
    expect(onFiles.mock.calls[0]![0]).toHaveLength(1);
  });

  it('shows progress instead of the button while uploading, and ignores drops', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDrop onFiles={onFiles} progress={42} />);
    expect(screen.getByRole('status').textContent).toContain('42%');
    expect(screen.queryByLabelText('Fájl kiválasztása')).toBeNull();
    fireEvent.drop(container.querySelector('.sd-drop')!, { dataTransfer: { files: [pdf()] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('announces an error', () => {
    render(<FileDrop onFiles={vi.fn()} error="Ezt a fájltípust nem tudjuk feldolgozni." />);
    expect(screen.getByRole('alert').textContent).toBe('Ezt a fájltípust nem tudjuk feldolgozni.');
  });
});
