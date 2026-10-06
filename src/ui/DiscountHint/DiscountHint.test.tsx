/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nextDiscountHint } from '@/domain/pricing';
import { DiscountHint } from './DiscountHint';

describe('DiscountHint', () => {
  it('reads like the brief from the domain hint', () => {
    const hint = nextDiscountHint(3)!;
    const { container } = render(<DiscountHint additionalQty={hint.additionalQty} pct={hint.pct} />);
    expect(container.textContent).toBe('Még 2 db és−10%');
  });
});
