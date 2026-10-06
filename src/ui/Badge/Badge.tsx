import type { HTMLAttributes } from 'react';
import { ORDER_STATUSES, type OrderStatus } from '@/domain/orders';
import '../base.css';
import { cx } from '../cx';
import './Badge.css';

export type BadgeTone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'placeholder';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** neutral (default), brand ("Expressz"), ok / warn / bad (states), placeholder ("Helyőrző", dashed). */
  tone?: BadgeTone;
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
}

/** Short uppercase label: "Expressz", "Helyőrző", "Online ár", a status. Not interactive. */
export function Badge({ tone = 'neutral', solid = false, dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('sd-badge', tone !== 'neutral' && `sd-badge--${tone}`, solid && 'sd-badge--solid', className)} {...rest}>
      {dot && <span className="sd-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Badge tone per order status: who has to act next, and whether it ended well. */
export const ORDER_STATUS_TONES: Readonly<Record<OrderStatus, BadgeTone>> = {
  beerkezett: 'neutral',
  modositas: 'warn',
  visszaigazolva: 'warn',
  gyartas: 'brand',
  elkeszult: 'ok',
  teljesitve: 'ok',
  elutasitva: 'bad',
  lemondva: 'neutral',
  lejart: 'bad',
};

export interface OrderStatusBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  status: OrderStatus;
}

/** The status of an order with its customer-facing label ("Gyártás alatt", "Visszaigazolva, befizetésre vár"). */
export function OrderStatusBadge({ status, dot = true, ...rest }: OrderStatusBadgeProps) {
  const info = ORDER_STATUSES.find((s) => s.id === status);
  return (
    <Badge tone={ORDER_STATUS_TONES[status]} dot={dot} {...rest}>
      {info?.label ?? status}
    </Badge>
  );
}
