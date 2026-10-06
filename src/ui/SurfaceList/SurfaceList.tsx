import type { HTMLAttributes } from 'react';
import { formatNumberHu } from '@/domain/money';
import '../base.css';
import { Button } from '../Button/Button';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';
import './SurfaceList.css';

export interface Surface {
  id: string;
  /** Pages of the PDF with this surface (identical pages are merged into one surface). */
  pages: readonly number[];
  widthMm: number;
  heightMm: number;
  /** Pieces per set (how many identical pages were merged). */
  count: number;
  /** Optional name, e.g. "Bal oldali ablak". */
  label?: string;
  thumbnailUrl?: string;
  /** Left out of the order. */
  skipped?: boolean;
}

export interface SurfaceListProps extends HTMLAttributes<HTMLDivElement> {
  surfaces: readonly Surface[];
  /** Number of sets (e.g. one per shop window). */
  sets: number;
  onSetsChange: (sets: number) => void;
  /** Leaves a surface out of the order, or takes it back. */
  onToggleSkip?: (id: string) => void;
}

const area = (s: Surface) => (s.widthMm * s.heightMm * s.count) / 1_000_000;
const pageList = (pages: readonly number[]) => `${pages.map((p) => `${p}.`).join(', ')} oldal`;

/**
 * The surfaces of a multi-page PDF (a surface package, e.g. window film per window): identical pages merged
 * into one surface with a count, each one skippable, and a set count for the whole package.
 */
export function SurfaceList({ surfaces, sets, onSetsChange, onToggleSkip, className, ...rest }: SurfaceListProps) {
  const active = surfaces.filter((s) => !s.skipped);
  const pieces = active.reduce((n, s) => n + s.count, 0) * sets;
  const totalM2 = active.reduce((a, s) => a + area(s), 0) * sets;
  const pageCount = surfaces.reduce((n, s) => n + s.pages.length, 0);
  return (
    <div className={cx('sd-surfaces', className)} {...rest}>
      <div className="sd-surfaces__head">
        <p className="sd-surfaces__summary">
          {pageCount} oldal, {surfaces.length} különböző felület
        </p>
        <QuantityStepper label="Készletszám" value={sets} onChange={onSetsChange} />
      </div>
      <ul className="sd-surfaces__list">
        {surfaces.map((s, i) => (
          <li key={s.id} className="sd-surface" data-skipped={s.skipped ? 'true' : undefined}>
            <span className="sd-surface__thumb" aria-hidden="true">
              {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" /> : <Icon name="file" />}
            </span>
            <div className="sd-surface__body">
              <span className="sd-surface__title">{s.label ?? `${i + 1}. felület`}</span>
              <span className="sd-surface__meta">
                {pageList(s.pages)} · {formatNumberHu(s.widthMm, 0)}×{formatNumberHu(s.heightMm, 0)}
                {'\u00a0'}mm · {s.count}
                {'\u00a0'}db/készlet · {formatNumberHu(area(s), 2)}
                {'\u00a0'}m²
              </span>
            </div>
            {onToggleSkip && (
              <Button variant="link" size="sm" onClick={() => onToggleSkip(s.id)}>
                {s.skipped ? 'Visszaveszem' : 'Kihagyom'}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="sd-surfaces__total">
        Összesen {pieces}
        {'\u00a0'}db, {formatNumberHu(totalM2, 2)}
        {'\u00a0'}m²
      </p>
    </div>
  );
}
