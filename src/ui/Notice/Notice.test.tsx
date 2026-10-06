/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Notice } from './Notice';

describe('Notice', () => {
  it('is static by default: no live region', () => {
    const { container } = render(<Notice>A végleges ár eltérhet a kalkulált ártól.</Notice>);
    expect(container.firstElementChild?.hasAttribute('role')).toBe(false);
    expect(container.firstElementChild?.className).toBe('sd-notice');
  });

  it('announces messages that appear after an action', () => {
    const { rerender } = render(
      <Notice tone="success" live="polite" title="Kosárba tettük">
        Molinó, 200 × 100 cm, 1 db.
      </Notice>,
    );
    expect(screen.getByRole('status').textContent).toContain('Kosárba tettük');
    rerender(
      <Notice tone="error" live="assertive">
        A fájlt nem sikerült megnyitni.
      </Notice>,
    );
    expect(screen.getByRole('alert').className).toBe('sd-notice sd-notice--error');
  });
});
