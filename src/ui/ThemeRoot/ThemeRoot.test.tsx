/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SITE_THEMES } from '@/site/themes';
import { ThemeRoot } from './ThemeRoot';

describe('ThemeRoot', () => {
  it('defaults to the first site theme, like the site itself', () => {
    const { container } = render(<ThemeRoot>Tartalom</ThemeRoot>);
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe(SITE_THEMES[0]?.id);
  });

  it.each(SITE_THEMES.map((t) => [t.id]))('sets data-theme="%s"', (id) => {
    const { container } = render(<ThemeRoot theme={id}>Tartalom</ThemeRoot>);
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe(id);
    expect(container.firstElementChild?.className).toBe('sd-theme');
  });
});
