import * as React from 'react';

/**
 * SuccessPanel — from @stiletdekor/ui@0.1.0.
 */
export interface SuccessPanelProps {
  /** "Megkaptuk az ajánlatkérését", "Megkaptuk a rendelését". */
  title: string;
  /** The reference the customer can quote on the phone, e.g. "AK-2026-0142". */
  reference?: string;
  /** Label before the reference, "Azonosító" by default. */
  referenceLabel?: string;
  /** What happens next, in order ("Visszahívjuk egy munkanapon belül." …). */
  nextSteps?: readonly ReactNode[];
  /** Small print, e.g. "A végleges árajánlat eltérhet a kalkulált ártól.". */
  note?: React.ReactNode;
  /** Buttons or links, e.g. "Új ajánlatkérés". */
  actions?: React.ReactNode;
  /** Moves focus to the title when shown, so screen readers announce it after a submit. */
  autoFocus?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const SuccessPanel: React.ComponentType<SuccessPanelProps>;
