import { describe, expect, it } from 'vitest';
import { budapestDateTime, callbackEmail } from './email';

describe('budapestDateTime', () => {
  it('shows the time in Budapest, summer and winter', () => {
    expect(budapestDateTime('2026-10-08T12:05:00.000Z')).toBe('2026. 10. 08. 14:05');
    expect(budapestDateTime('2026-12-01T07:30:00.000Z')).toBe('2026. 12. 01. 08:30');
  });
});

describe('callbackEmail', () => {
  const request = {
    id: 87,
    name: 'Kiss Péter',
    phone: '06 70 123 4567',
    jobType: 'autofoliazas' as const,
    message: 'A kisbuszunkra kellene <felirat>.',
    source: '/visszahivas',
    createdAt: '2026-10-08T12:05:00.000Z',
  };

  it('puts the reference, the job and the name in the subject', () => {
    expect(callbackEmail(request, 'muhely@example.com')).toMatchObject({
      to: 'muhely@example.com',
      subject: '[VH-0087] Visszahívás – Kiss Péter',
    });
  });

  it('lists every given answer in the text', () => {
    expect(callbackEmail(request, 'm@example.com').text).toBe(
      [
        'Visszahívást kértek a weboldalon.',
        '',
        'Hivatkozási szám: VH-0087',
        'Név: Kiss Péter',
        'Telefon: 06 70 123 4567',
        'Munka típusa: Autófóliázás, flotta-dekor',
        'Röviden: A kisbuszunkra kellene <felirat>.',
        'Honnan: /visszahivas',
        'Beérkezett: 2026. 10. 08. 14:05',
      ].join('\n'),
    );
  });

  it('leaves out the unanswered fields, makes the phone clickable and escapes the HTML', () => {
    const { text, html } = callbackEmail({ ...request, jobType: undefined, message: undefined, source: undefined }, 'm@example.com');
    expect(text).not.toContain('Munka típusa');
    expect(text).not.toContain('Röviden');
    expect(html).toContain('<a href="tel:06701234567">06 70 123 4567</a>');
    expect(callbackEmail(request, 'm@example.com').html).toContain('A kisbuszunkra kellene &lt;felirat&gt;.');
  });

  it('keeps the subject on one line whatever the name holds', () => {
    expect(callbackEmail({ ...request, name: 'Kiss\r\nBcc: x@example.com' }, 'm@example.com').subject).toBe(
      '[VH-0087] Visszahívás – Kiss Bcc: x@example.com',
    );
  });
});
