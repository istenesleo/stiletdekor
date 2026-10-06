/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavLink, TextLink } from './TextLink';

describe('TextLink', () => {
  it('opens external links in a new tab without leaking the opener', () => {
    render(
      <TextLink href="https://maps.google.com" external>
        Térkép
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: 'Térkép' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('stays in the tab by default', () => {
    render(<TextLink href="#aszf">ÁSZF</TextLink>);
    expect(screen.getByRole('link').hasAttribute('target')).toBe(false);
  });
});

describe('NavLink', () => {
  it('marks the current page', () => {
    render(
      <nav>
        <NavLink href="#webshop" current>
          Webshop
        </NavLink>
        <NavLink href="#referenciak">Referenciák</NavLink>
      </nav>,
    );
    expect(screen.getByRole('link', { name: 'Webshop' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Referenciák' }).hasAttribute('aria-current')).toBe(false);
  });
});
