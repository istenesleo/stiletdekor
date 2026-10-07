import { ORDER_STATUSES, type OrderStatus } from '@/domain/orders';
import { Badge, type BadgeProps, type BadgeTone } from '../Badge/Badge';

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

/**
 * The status of an order as a badge with its customer-facing label.
 * E.g. "Gyártás alatt", "Visszaigazolva, befizetésre vár".
 * @category basics
 */
export function OrderStatusBadge({ status, dot = true, ...rest }: OrderStatusBadgeProps) {
  const info = ORDER_STATUSES.find((s) => s.id === status);
  return (
    <Badge tone={ORDER_STATUS_TONES[status]} dot={dot} {...rest}>
      {info?.label ?? status}
    </Badge>
  );
}
