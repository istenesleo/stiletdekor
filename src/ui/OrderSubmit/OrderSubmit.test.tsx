/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FINAL_PRICE_NOTICE, ORDER_SUBMIT_LABEL } from '@/domain/orders';
import { OrderSubmit } from './OrderSubmit';

describe('OrderSubmit', () => {
  it('uses the domain wording, reports acceptance and submits', () => {
    const onAcceptedChange = vi.fn();
    const onSubmit = vi.fn();
    render(<OrderSubmit accepted={false} onAcceptedChange={onAcceptedChange} onSubmit={onSubmit} />);
    expect(screen.getByText(new RegExp(FINAL_PRICE_NOTICE.replace('.', '\\.')))).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onAcceptedChange).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: ORDER_SUBMIT_LABEL }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows the error and does not submit while loading', () => {
    const onSubmit = vi.fn();
    render(<OrderSubmit accepted onAcceptedChange={vi.fn()} onSubmit={onSubmit} loading error="Fogadja el az ÁSZF-et." />);
    expect(screen.getByText('Fogadja el az ÁSZF-et.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: ORDER_SUBMIT_LABEL }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
