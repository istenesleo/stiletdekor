import type { HTMLAttributes } from 'react';
import { formatNumberHu } from '@/domain/money';
import '../base.css';
import { cx } from '../cx';
import './DimensionLine.css';

export interface DimensionLineProps extends HTMLAttributes<HTMLDivElement> {
  /** horizontal (default) fills the container's width; vertical fills its height. */
  orientation?: 'horizontal' | 'vertical';
  /** The measured length in millimetres, printed as "4 200 mm". */
  valueMm?: number;
  /** Text to print instead of valueMm (e.g. "85 cm"). */
  label?: string;
  /** Hide from screen readers when the same size is already stated in text nearby. */
  decorative?: boolean;
}

/**
 * The brand's measuring motif: a dimension line with arrowheads, end ticks and the size in millimetres, in
 * the measure color. Use it to show real sizes (previews, product tiles, illustrations), not as decoration.
 */
export function DimensionLine({
  orientation = 'horizontal',
  valueMm,
  label,
  decorative = false,
  className,
  ...rest
}: DimensionLineProps) {
  const text = label ?? (valueMm !== undefined ? `${formatNumberHu(valueMm, 0)}\u00a0mm` : '');
  return (
    <div
      className={cx('sd-dim', `sd-dim--${orientation}`, className)}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': text })}
      {...rest}
    >
      <span className="sd-dim__line sd-dim__line--start" />
      {text && <span className="sd-dim__label">{text}</span>}
      <span className="sd-dim__line sd-dim__line--end" />
    </div>
  );
}
