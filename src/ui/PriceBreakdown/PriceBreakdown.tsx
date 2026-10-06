import type { HTMLAttributes, ReactNode } from 'react';
import { formatHuf } from '@/domain/money';
import '../base.css';
import { cx } from '../cx';
import './PriceBreakdown.css';

export interface PriceRow {
  /** "Anyag · Standard frontlit", "Szélkidolgozás · Szegés + ringli", "Mennyiségi kedvezmény (−10%)". */
  label: ReactNode;
  /** The calculation in small mono type: "2,00 m² × 5 067 Ft". */
  detail?: ReactNode;
  /** Gross amount in forints; a discount is a negative number. */
  amount?: number;
  /** Text instead of an amount, e.g. "egyedi" for installation. */
  amountText?: string;
  /** discount: shown in the success color; muted: quieter (e.g. a free option). */
  kind?: 'discount' | 'muted';
}

export interface PriceBreakdownProps extends HTMLAttributes<HTMLDivElement> {
  rows: readonly PriceRow[];
  /** Gross total in forints. */
  total: number;
  /** "Kalkulált ár, bruttó" by default. */
  totalLabel?: string;
  /** Net amount and VAT for the small line under the total. */
  net?: number;
  vat?: number;
  /** Small print under the total, e.g. "A végleges ár eltérhet a kalkulált ártól.". */
  note?: ReactNode;
  /** Hidden table caption, "Tételes árbontás" by default. */
  caption?: string;
}

const minus = '−';
const money = (row: PriceRow) =>
  row.amountText ?? (row.amount === undefined ? '' : row.amount < 0 ? `${minus}${formatHuf(-row.amount)}` : formatHuf(row.amount));

/**
 * Itemised price: one row per component of the price, the gross total large, net and VAT small under it.
 * Every amount is gross (the site shows gross prices only).
 */
export function PriceBreakdown({
  rows,
  total,
  totalLabel = 'Kalkulált ár, bruttó',
  net,
  vat,
  note,
  caption = 'Tételes árbontás',
  className,
  ...rest
}: PriceBreakdownProps) {
  return (
    <div className={cx('sd-price', className)} {...rest}>
      <table className="sd-price__table">
        <caption className="sd-vh">{caption}</caption>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.kind ? `sd-price__row--${row.kind}` : undefined}>
              <th scope="row">
                {row.label}
                {row.detail && <span className="sd-price__detail">{row.detail}</span>}
              </th>
              <td>{money(row)}</td>
            </tr>
          ))}
          <tr className="sd-price__total">
            <th scope="row">{totalLabel}</th>
            <td>{formatHuf(total)}</td>
          </tr>
        </tbody>
      </table>
      {net !== undefined && vat !== undefined && (
        <p className="sd-price__netvat">
          ebből nettó {formatHuf(net)}, ÁFA {formatHuf(vat)}
        </p>
      )}
      {note && <p className="sd-price__note">{note}</p>}
    </div>
  );
}
