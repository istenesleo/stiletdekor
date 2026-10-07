/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the tone as a class; neutral needs none', () => {
    const { container, rerender } = render(<Badge>Webshop</Badge>);
    expect(container.firstElementChild?.className).toBe('sd-badge');
    rerender(
      <Badge tone="placeholder" solid>
        Helyőrző
      </Badge>,
    );
    expect(container.firstElementChild?.className).toBe('sd-badge sd-badge--placeholder sd-badge--solid');
  });
});
