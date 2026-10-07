import type { HTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './Stepper.css';

export interface StepperProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Step names, e.g. ["Típus", "Részletek", "Helyszín és fotók", "Kapcsolat"]. */
  steps: readonly string[];
  /** Index of the current step, from 0. */
  current: number;
  /** Furthest step reached; earlier steps can be revisited. Defaults to `current`. */
  reached?: number;
  /** Makes reached steps clickable (going back to change an answer). */
  onStepClick?: (index: number) => void;
  /** Accessible name of the step list, "Lépések" by default. */
  label?: string;
}

/** Elative suffix of a number as Hungarians read it: 4-ből (négyből), 3-ból (háromból), 10-ből (tízből). */
export function elativeSuffix(n: number): 'ból' | 'ből' {
  const back = new Set([3, 6, 8]);
  if (n % 10 !== 0) return back.has(n % 10) ? 'ból' : 'ből';
  if (n % 1000 === 0) return 'ből'; // ezer
  if (n % 100 === 0) return 'ból'; // száz
  return [20, 30, 60, 80].includes(n % 100) ? 'ból' : 'ből'; // húsz, harminc, hatvan, nyolcvan
}

/**
 * Progress through a multi-step form such as the quote wizard, with the steps as a bar.
 * Shows "2. lépés a 4-ből". Steps already reached can be clicked to go back. When it is narrow (phones), the
 * bar shows only the step numbers and the current step's name moves next to the count.
 * @category quote
 */
export function Stepper({ steps, current, reached = current, onStepClick, label = 'Lépések', className, ...rest }: StepperProps) {
  return (
    <nav className={cx('sd-steps', className)} aria-label={label} {...rest}>
      <p className="sd-steps__count sd-caps">
        {current + 1}. lépés a {steps.length}-{elativeSuffix(steps.length)}
        <span className="sd-steps__now" aria-hidden="true">
          {' '}
          · {steps[current]}
        </span>
      </p>
      <ol className="sd-steps__list">
        {steps.map((name, i) => {
          const state = i === current ? 'current' : i <= reached ? 'done' : 'todo';
          const inner = (
            <>
              <span className="sd-steps__n" aria-hidden="true">
                {i + 1}
              </span>
              <span className="sd-steps__label">{name}</span>
            </>
          );
          return (
            <li key={name} className="sd-steps__item" data-state={state}>
              {onStepClick && state === 'done' ? (
                <button type="button" className="sd-steps__step" onClick={() => onStepClick(i)}>
                  {inner}
                </button>
              ) : (
                <span className="sd-steps__step" aria-current={state === 'current' ? 'step' : undefined}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
