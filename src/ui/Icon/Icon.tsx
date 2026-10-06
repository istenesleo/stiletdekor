import type { SVGAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './Icon.css';
import { ICONS, type IconName } from './icons';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** Which icon to draw. */
  name: IconName;
  /** Size in px; by default the icon is 1.25× the surrounding font size. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  label?: string;
}

/** A line icon from the Stilet set (24×24, current text color). Decorative unless it gets a `label`. */
export function Icon({ name, size, label, className, style, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx('sd-icon', className)}
      style={size ? { width: size, height: size, ...style } : style}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: false })}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
      {...rest}
    />
  );
}

export type { IconName };
