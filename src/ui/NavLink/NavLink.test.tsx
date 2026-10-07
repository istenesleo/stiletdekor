/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavLink } from './NavLink';

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
