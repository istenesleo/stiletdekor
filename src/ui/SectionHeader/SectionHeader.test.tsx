/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders eyebrow, an h2 title with an id, and the lead', () => {
    render(
      <SectionHeader
        eyebrow="Webshop · azonnali ár"
        title="Rendelje meg online"
        lead="Méret, anyag, grafika: az árat és a határidőt azonnal látja."
        titleId="shopTitle"
      />,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Rendelje meg online' });
    expect(heading.id).toBe('shopTitle');
    expect(screen.getByText('Webshop · azonnali ár').className).toBe('sd-caps');
  });

  it('can be the page title', () => {
    render(<SectionHeader title="Kapcsolat" level={1} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });
});
