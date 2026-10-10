import { describe, expect, it } from 'vitest';
import { SHIPPING_METHOD_IDS } from './catalog';
import {
  FINAL_PRICE_NOTICE,
  ORDER_NEXT_STEPS,
  ORDER_STATUSES,
  ORDER_STATUS_IDS,
  ORDER_SUBMIT_LABEL,
  ORDER_TRANSITIONS,
  READY_MESSAGES,
  UNPAID_ORDER_AUTO_CLOSE_DAYS,
  canTransition,
  getOrderStatus,
  nextStatuses,
  orderNextStep,
  unpaidOrderClosesOn,
} from './orders';

describe('order texts', () => {
  it('the submit button and the notices say what the brief decided', () => {
    expect(ORDER_SUBMIT_LABEL).toBe('Rendelés elküldése ellenőrzésre');
    expect(FINAL_PRICE_NOTICE).toBe('A végleges ár eltérhet a kalkulált ártól.');
  });

  it('has a ready message for every handover method', () => {
    expect(Object.keys(READY_MESSAGES).sort()).toEqual([...SHIPPING_METHOD_IDS].sort());
  });
});

describe('order statuses', () => {
  it('lists every status once, in lifecycle order', () => {
    expect(ORDER_STATUSES.map((s) => s.id)).toEqual([...ORDER_STATUS_IDS]);
    expect(getOrderStatus('visszaigazolva').label).toBe('Visszaigazolva, befizetésre vár');
  });

  it('only uses known statuses in transitions, and closed statuses lead nowhere except a late payment', () => {
    const known = new Set<string>(ORDER_STATUS_IDS);
    for (const t of ORDER_TRANSITIONS) {
      expect(known.has(t.from) && known.has(t.to)).toBe(true);
      expect(t.by.length).toBeGreaterThan(0);
    }
    const closed = ORDER_STATUSES.filter((s) => !s.open).map((s) => s.id);
    expect(ORDER_TRANSITIONS.filter((t) => closed.includes(t.from))).toEqual([
      { from: 'lejart', to: 'gyartas', by: ['muhely'] },
    ]);
  });

  it('production starts only from the payment', () => {
    expect(ORDER_TRANSITIONS.filter((t) => t.to === 'gyartas').map((t) => t.from)).toEqual(['visszaigazolva', 'lejart']);
    expect(canTransition('beerkezett', 'gyartas', 'muhely')).toBe(false);
  });

  it('the customer can only withdraw or resubmit; closing an unpaid order is automatic', () => {
    expect(nextStatuses('beerkezett', 'vasarlo')).toEqual(['lemondva']);
    expect(nextStatuses('modositas', 'vasarlo')).toEqual(['beerkezett', 'lemondva']);
    expect(nextStatuses('visszaigazolva', 'vasarlo')).toEqual(['lemondva']);
    expect(nextStatuses('gyartas', 'vasarlo')).toEqual([]);
    expect(canTransition('visszaigazolva', 'lejart', 'rendszer')).toBe(true);
    expect(canTransition('visszaigazolva', 'lejart', 'vasarlo')).toBe(false);
  });

  it('every open status can still reach a closed one', () => {
    for (const status of ORDER_STATUSES.filter((s) => s.open)) {
      const reachable = new Set([status.id]);
      for (let grew = true; grew; ) {
        grew = false;
        for (const t of ORDER_TRANSITIONS) {
          if (reachable.has(t.from) && !reachable.has(t.to)) {
            reachable.add(t.to);
            grew = true;
          }
        }
      }
      expect([...reachable].some((id) => !getOrderStatus(id).open)).toBe(true);
    }
  });
});

describe('unpaid orders', () => {
  it(`close ${UNPAID_ORDER_AUTO_CLOSE_DAYS} calendar days after the confirmation`, () => {
    expect(unpaidOrderClosesOn('2026-10-05')).toBe('2026-10-13');
    expect(unpaidOrderClosesOn('2026-12-28')).toBe('2027-01-05');
  });
});

describe('orderNextStep', () => {
  it('has a text for every status, and the ready text depends on the handover', () => {
    for (const status of ORDER_STATUS_IDS) expect(ORDER_NEXT_STEPS[status].length).toBeGreaterThan(10);
    expect(orderNextStep('beerkezett', 'futar')).toContain('díjbekérő');
    expect(orderNextStep('elkeszult', 'szemelyes')).toBe('Elkészült, átveheti a műhelyben.');
    expect(orderNextStep('elkeszult', 'telepites')).toBe('Elkészült, egyeztetjük a telepítés időpontját.');
  });
});
