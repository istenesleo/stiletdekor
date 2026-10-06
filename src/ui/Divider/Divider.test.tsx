/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('is a plain hairline without a label', () => {
    const { container } = render(<Divider />);
    expect(container.firstElementChild?.tagName).toBe('HR');
  });

  it('names the group that follows when it has a label', () => {
    const { container } = render(<Divider label="Átvétel" />);
    expect(container.firstElementChild?.className).toBe('sd-divider sd-divider--labelled');
    expect(container.textContent).toBe('Átvétel');
  });
});
