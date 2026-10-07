import { type HTMLAttributes, useEffect, useId, useRef, useState } from 'react';
import { formatNumberHu } from '@/domain/money';
import '../base.css';
import { cx } from '../cx';
import './ScalePreview.css';

export interface ScaleMark {
  /** Position from the product's top-left corner, in cm. */
  x: number;
  y: number;
}

export interface ScalePreviewProps extends HTMLAttributes<HTMLDivElement> {
  /** Product size in cm. */
  widthCm: number;
  heightCm: number;
  /** The uploaded artwork (an image URL); a placeholder without it. */
  imageUrl?: string;
  /** fill: covers the product, cropping the edges (default); fit: whole image visible, framed. */
  fit?: 'fill' | 'fit';
  /** Lifts the product off the floor, e.g. a sign above a door, in cm. */
  elevationCm?: number;
  /** A floor stand under the product (roll-up). */
  stand?: boolean;
  /** Holes or grommets on the product. */
  marks?: readonly ScaleMark[];
}

const PERSON_W = 56;
const PERSON_H = 180;
const STAND_H = 9;
const mm = (cm: number) => `${formatNumberHu(Math.round(cm * 10), 0)}\u00a0mm`;

/**
 * The product at real scale next to a 180 cm figure, with dimension lines in millimetres.
 * Shows the artwork in the chosen fit. Redraws to its container's size; keep it at least ~280 px wide.
 * @category shop
 */
export function ScalePreview({
  widthCm,
  heightCm,
  imageUrl,
  fit = 'fill',
  elevationCm = 0,
  stand = false,
  marks = [],
  className,
  ...rest
}: ScalePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 640, h: 400 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry?.contentRect;
      if (r && r.width > 0 && r.height > 0) setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const clipId = `sd-scale-clip${useId().replace(/:/g, '')}`;

  const w = Math.max(1, widthCm);
  const h = Math.max(1, heightCm);
  const lift = Math.max(elevationCm, stand ? STAND_H : 0);
  const narrow = box.w < 480;
  const pad = { l: narrow ? 34 : 46, r: narrow ? 46 : 60, t: narrow ? 40 : 48, b: narrow ? 30 : 36 };
  const gap = Math.min(110, Math.max(30, w * 0.14));
  const contentW = PERSON_W + gap + w;
  const contentH = Math.max(PERSON_H, lift + h);
  const k = Math.max(1e-6, Math.min((box.w - pad.l - pad.r) / contentW, (box.h - pad.t - pad.b) / contentH)); // px per cm
  const u = 1 / k; // cm per px
  const extra = (box.w - pad.l - pad.r - contentW * k) / 2;
  const minX = -(pad.l + extra) * u;
  const minY = -(box.h - pad.b) * u;
  const vbW = box.w * u;
  const vbH = box.h * u;

  const x0 = PERSON_W + gap;
  const y0 = -(lift + h);
  const fs = (narrow ? 10 : 11) * u;
  const sw = u; // 1 px strokes
  const arrow = 7 * u;
  const tick = 5 * u;

  const hDim = (xa: number, xb: number, y: number, label: string) => {
    const tw = label.length * fs * 0.62 + 8 * u;
    const cx = (xa + xb) / 2;
    return (
      <g className="sd-scale__dim" strokeWidth={sw}>
        <path d={`M${xa} ${y - tick}v${tick * 2}M${xb} ${y - tick}v${tick * 2}M${xa} ${y}H${xb}`} fill="none" />
        <path d={`M${xa} ${y}l${arrow} ${-arrow * 0.38}v${arrow * 0.76}zM${xb} ${y}l${-arrow} ${-arrow * 0.38}v${arrow * 0.76}z`} stroke="none" />
        <rect className="sd-scale__dim-bg" x={cx - tw / 2} y={y - fs * 0.75} width={tw} height={fs * 1.5} />
        <text x={cx} y={y} fontSize={fs} textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      </g>
    );
  };
  const vDim = (x: number, ya: number, yb: number, label: string) => {
    const tw = label.length * fs * 0.62 + 8 * u;
    const cy = (ya + yb) / 2;
    return (
      <g className="sd-scale__dim" strokeWidth={sw}>
        <path d={`M${x - tick} ${ya}h${tick * 2}M${x - tick} ${yb}h${tick * 2}M${x} ${ya}V${yb}`} fill="none" />
        <path d={`M${x} ${ya}l${-arrow * 0.38} ${arrow}h${arrow * 0.76}zM${x} ${yb}l${-arrow * 0.38} ${-arrow}h${arrow * 0.76}z`} stroke="none" />
        <rect className="sd-scale__dim-bg" x={x - fs * 0.75} y={cy - tw / 2} width={fs * 1.5} height={tw} />
        <text x={x} y={cy} fontSize={fs} textAnchor="middle" dominantBaseline="central" transform={`rotate(-90 ${x} ${cy})`}>
          {label}
        </text>
      </g>
    );
  };

  const phSize = Math.min(h * 0.16, w * 0.08);
  const showPh = !imageUrl && phSize * k >= 9;
  const label = `Valós léptékű előnézet: ${formatNumberHu(w)}×${formatNumberHu(h)} cm, mellette 180 cm magas alak`;

  return (
    <div ref={ref} className={cx('sd-scale', className)} {...rest}>
      <svg className="sd-scale__svg" viewBox={`${minX} ${minY} ${vbW} ${vbH}`} role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <rect x={x0} y={y0} width={w} height={h} />
          </clipPath>
        </defs>
        <line className="sd-scale__floor" x1={minX} y1={0} x2={minX + vbW} y2={0} strokeWidth={sw} />
        <g className="sd-scale__person" transform={`translate(0 ${-PERSON_H})`}>
          <ellipse cx="28" cy="11" rx="8.6" ry="10.6" />
          <rect x="24" y="19" width="8" height="8" />
          <path d="M12 31q0-6 7-6h18q7 0 7 6l-2 64H14z" />
          <rect x="4" y="29" width="7.5" height="62" rx="3.7" />
          <rect x="44.5" y="29" width="7.5" height="62" rx="3.7" />
          <rect x="14.5" y="90" width="12.5" height="90" rx="4" />
          <rect x="29" y="90" width="12.5" height="90" rx="4" />
        </g>
        {vDim(-16 * u, -PERSON_H, 0, mm(PERSON_H))}
        {stand && <rect className="sd-scale__stand" x={x0 - 3} y={-STAND_H} width={w + 6} height={STAND_H} />}
        <rect className="sd-scale__board" x={x0} y={y0} width={w} height={h} strokeWidth={sw} />
        {imageUrl && (
          <image
            href={imageUrl}
            x={x0}
            y={y0}
            width={w}
            height={h}
            preserveAspectRatio={fit === 'fit' ? 'xMidYMid meet' : 'xMidYMid slice'}
            clipPath={`url(#${clipId})`}
          />
        )}
        {showPh && (
          <text className="sd-scale__ph" x={x0 + w / 2} y={y0 + h / 2} fontSize={phSize} textAnchor="middle" dominantBaseline="central">
            GRAFIKA HELYE
          </text>
        )}
        {marks.map((m, i) => (
          <circle key={i} className="sd-scale__mark" cx={x0 + m.x} cy={y0 + m.y} r={Math.max(0.6, 2.4 * u)} strokeWidth={sw} />
        ))}
        {hDim(x0, x0 + w, y0 - 22 * u, mm(w))}
        {vDim(x0 + w + 22 * u, y0, y0 + h, mm(h))}
      </svg>
      <p className="sd-scale__note" aria-hidden="true">
        Valós lépték · alak: 180 cm
      </p>
    </div>
  );
}
