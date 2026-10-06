/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckoutSection } from './CheckoutSection';

describe('CheckoutSection', () => {
  it('is a region named by its title', () => {
    render(
      <CheckoutSection step={3} title="Átvétel" description="Hogyan kapja meg a kész munkát?">
        <p>Személyes átvétel</p>
      </CheckoutSection>,
    );
    expect(screen.getByRole('region', { name: 'Átvétel' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Átvétel' })).toBeTruthy();
  });
});
