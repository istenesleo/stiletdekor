/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is a primary, type="button" button by default', () => {
    render(<Button>Kosárba</Button>);
    const button = screen.getByRole('button', { name: 'Kosárba' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toBe('sd-btn sd-btn--primary');
  });

  it('sets the variant, size and width classes', () => {
    render(
      <Button variant="ghost" size="sm" block className="extra">
        Részletek
      </Button>,
    );
    expect(screen.getByRole('button').className).toBe('sd-btn sd-btn--ghost sd-btn--sm sd-btn--block extra');
  });

  it('puts a decorative icon before or after the label', () => {
    const { container } = render(
      <Button icon="arrow-right" iconPosition="end">
        Tovább
      </Button>,
    );
    const button = container.querySelector('button')!;
    expect(button.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(button.firstElementChild?.textContent).toBe('Tovább');
  });

  it('while loading, tells assistive tech and swallows clicks', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Rendelés elküldése ellenőrzésre
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Rendelés elküldése ellenőrzésre' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick otherwise', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Kosárba</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
