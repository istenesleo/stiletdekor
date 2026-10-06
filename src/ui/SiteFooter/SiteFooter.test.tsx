/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('lists the link columns, the contacts and the legal pages', () => {
    render(<SiteFooter year={2026} />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Szolgáltatások',
      'Rendelés',
      'Kapcsolat',
    ]);
    expect(within(footer).getByRole('link', { name: '+36 70 538 5030' }).getAttribute('href')).toBe('tel:+36705385030');
    expect(within(footer).getByRole('link', { name: 'stiletdekor@gmail.com' }).getAttribute('href')).toBe(
      'mailto:stiletdekor@gmail.com',
    );
    expect(within(footer).getByText('Budapest, Schweidel József u. 1–3.')).toBeTruthy();
    expect(within(footer).getByText('© 2026 Stilet Dekor')).toBeTruthy();
    expect(within(footer).getByRole('link', { name: 'ÁSZF' }).getAttribute('href')).toBe('/aszf');
    expect(within(footer).getByRole('link', { name: 'Adatkezelési tájékoztató' })).toBeTruthy();
  });

  it('takes its own columns and legal links', () => {
    render(<SiteFooter year={2026} columns={[{ title: 'Oldal', links: [{ href: '/', label: 'Kezdőlap' }] }]} legal={[]} />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Oldal', 'Kapcsolat']);
    expect(screen.queryByRole('link', { name: 'ÁSZF' })).toBeNull();
  });
});
