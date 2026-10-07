/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ButtonLink } from './ButtonLink';

describe('ButtonLink', () => {
  it('is a link with button styling', () => {
    render(
      <ButtonLink href="#webshop" variant="secondary" icon="arrow-right" iconPosition="end">
        Webshop megnyitása
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Webshop megnyitása' });
    expect(link.getAttribute('href')).toBe('#webshop');
    expect(link.className).toBe('sd-btn sd-btn--secondary');
  });
});
