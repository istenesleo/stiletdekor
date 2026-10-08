// Tick marks of a centimetre ruler, the brand's measuring motif (Vonalzo.astro).

export type RulerTickKind = 'cm' | 'half' | 'mm';
export type RulerDetail = 'mm' | 'half';

export interface RulerTick {
  /** Distance from the zero mark in millimetres. */
  readonly mm: number;
  readonly kind: RulerTickKind;
  /** Whole centimetres carry their number. */
  readonly label: string | null;
}

/** Ticks of a ruler `lengthCm` long: every millimetre ('mm') or every half centimetre ('half'). */
export function rulerTicks(lengthCm: number, detail: RulerDetail = 'mm'): RulerTick[] {
  if (!Number.isInteger(lengthCm) || lengthCm < 1) {
    throw new RangeError(`lengthCm must be a positive whole number, got ${lengthCm}`);
  }
  const step = detail === 'mm' ? 1 : 5;
  const ticks: RulerTick[] = [];
  for (let mm = 0; mm <= lengthCm * 10; mm += step) {
    const kind: RulerTickKind = mm % 10 === 0 ? 'cm' : mm % 5 === 0 ? 'half' : 'mm';
    ticks.push({ mm, kind, label: kind === 'cm' ? String(mm / 10) : null });
  }
  return ticks;
}
