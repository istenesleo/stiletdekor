/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_IDS, ORDER_STATUSES } from '@/domain/orders';
import { Badge, ORDER_STATUS_TONES, OrderStatusBadge } from './Badge';

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

describe('OrderStatusBadge', () => {
  it('has a tone for every order status', () => {
    expect(Object.keys(ORDER_STATUS_TONES).sort()).toEqual([...ORDER_STATUS_IDS].sort());
  });

  it.each(ORDER_STATUSES.map((s) => [s.id, s.label]))('%s shows "%s"', (id, label) => {
    render(<OrderStatusBadge status={id} />);
    expect(screen.getByText(label).className).toContain(`sd-badge`);
  });
});
