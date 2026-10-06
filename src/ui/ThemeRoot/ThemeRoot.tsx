import type { HTMLAttributes } from 'react';
import type { SiteThemeId } from '@/site/themes';
import '../base.css';
import { cx } from '../cx';
import './ThemeRoot.css';

export type ThemeName = SiteThemeId;

export interface ThemeRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Design direction: "neon-muhely" (A, Neon műhely) or "galeria-editorial" (B, Galéria / editorial). */
  theme?: ThemeName;
}

/**
 * Sets the design direction for everything inside it: the token values (colors, fonts, sizes), the page
 * background and body text. Wrap a screen or a section once; do not nest two different themes.
 * The direction's web fonts must be loaded by the page (the site layout does it).
 */
export function ThemeRoot({ theme = 'neon-muhely', className, children, ...rest }: ThemeRootProps) {
  return (
    <div data-theme={theme} className={cx('sd-theme', className)} {...rest}>
      {children}
    </div>
  );
}
