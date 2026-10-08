import * as React from 'react';

/**
 * LeadTimeNote — from @stiletdekor/ui@0.1.0.
 */
export interface LeadTimeNoteProps {
  /** Estimated ready date (the domain's estimateOrderReadyDate), "YYYY-MM-DD". */
  readyBy: string;
  /** Express production: adds an "Expressz" badge and says 1 business day. */
  express?: boolean;
  /** Production time in business days without express; 3 by default. */
  productionDays?: number;
  /** Replaces the small line under the date. */
  detail?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const LeadTimeNote: React.ComponentType<LeadTimeNoteProps>;
