import type { HTMLAttributes } from 'react';
import { formatNumberHu } from '@/domain/money';
import { DPI_RATINGS, DPI_THRESHOLDS, type DpiRating } from '@/domain/preflight';
import '../base.css';
import { cx } from '../cx';
import './ReadinessLight.css';

export interface ReadinessLightProps extends HTMLAttributes<HTMLDivElement> {
  /** kivalo / megfelelo / gyenge (from the domain's preflight); empty before a file is uploaded. */
  rating?: DpiRating;
  /** Effective resolution at the chosen size. */
  dpi?: number;
  /** Vector artwork: sharp at any size, so the light is green without a dpi. */
  vector?: boolean;
}

const TONE = { ok: 'ok', warn: 'warn', bad: 'bad' } as const;

/**
 * Print-readiness traffic light: green from 150 dpi, yellow from 72 (fine for banners seen from a distance),
 * red below. Shows the effective dpi at the chosen size and what it means.
 */
export function ReadinessLight({ rating, dpi, vector = false, className, ...rest }: ReadinessLightProps) {
  let tone: 'ok' | 'warn' | 'bad' | 'none' = 'none';
  let title = 'Nyomdakész-ellenőrzés';
  let description = 'Töltse fel a grafikát: azonnal megmérjük a felbontását a választott méretben.';
  if (vector) {
    tone = 'ok';
    title = 'Vektoros fájl';
    description = 'Bármekkora méretben éles marad.';
  } else if (rating) {
    const info = DPI_RATINGS[rating];
    tone = TONE[info.tone];
    title = info.label;
    description = info.description;
  }
  return (
    <div className={cx('sd-ready', className)} data-tone={tone} {...rest}>
      <span className="sd-ready__lights" aria-hidden="true">
        <span className="sd-ready__light sd-ready__light--bad" />
        <span className="sd-ready__light sd-ready__light--warn" />
        <span className="sd-ready__light sd-ready__light--ok" />
      </span>
      <div className="sd-ready__text" aria-live="polite">
        <p className="sd-ready__title">
          <span>{title}</span>
          {!vector && rating && dpi !== undefined && <span className="sd-ready__dpi">{formatNumberHu(Math.round(dpi), 0)}{'\u00a0'}dpi</span>}
        </p>
        <p className="sd-ready__desc">{description}</p>
      </div>
    </div>
  );
}

/** The thresholds behind the light, for help texts: "≥150 kiváló · 72–149 megfelelő · <72 gyenge". */
export const READINESS_SCALE = `≥${DPI_THRESHOLDS.excellent} kiváló · ${DPI_THRESHOLDS.acceptable}–${DPI_THRESHOLDS.excellent - 1} megfelelő · <${DPI_THRESHOLDS.acceptable} gyenge`;
