import type { HTMLAttributes } from 'react';
import type { SiteThemeId } from '@/site/themes';
import '../base.css';
import { cx } from '../cx';
import './ThemeRoot.css';

export type ThemeName = SiteThemeId;

export interface ThemeRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Design direction: "neon-muhely" (A, Neon műhely), "galeria-editorial" (B, Galéria / editorial) or "merolap" (C, Mérőlap). */
  theme?: ThemeName;
}

/**
 * Sets the design direction (theme) for everything inside it: token values, page background, body text.
 * Wrap a screen once. A ThemeRoot inside another one fully re-themes its part, so the two directions can be
 * compared side by side. The direction's web fonts must be loaded by the page (the site layout does it).
 * @category basics
 */
export function ThemeRoot({ theme = 'neon-muhely', className, children, ...rest }: ThemeRootProps) {
  return (
    <div data-theme={theme} className={cx('sd-theme', className)} {...rest}>
      {children}
    </div>
  );
}
