import { describe, expect, it } from 'vitest';
import { formatFileSize, formatHuf } from '@/domain/money';
import { orderEmail } from './email';
import { FILE_A, FILE_B, ORDER, STATUS_TOKEN } from './test-order';

describe('orderEmail', () => {
  it('tells the workshop everything, with the files and the status page as links', () => {
    const email = orderEmail(ORDER, 'muhely@example.hu');
    expect(email.to).toBe('muhely@example.hu');
    expect(email.replyTo).toBe('maria@example.hu');
    // The subject is one plain line: oneLine turns the price's no-break spaces into spaces.
    expect(email.subject).toBe(`[R-0007] Rendelés ellenőrzésre – 2 tétel, ${formatHuf(25400).replace(/\s/g, ' ')} – Minta Mária`);
    const lines = email.text.split('\n');
    expect(lines).toEqual(
      expect.arrayContaining([
        'Rendelésszám: R-0007',
        'Telefon: +36 70 123 4567',
        'Adószám: 12345676-1-42',
        'Átvétel: Telepítéssel',
        'A telepítés helyszíne: 9021 Győr, Minta tér 2.',
        'Helyszíni felmérés: kéri',
        '1. Molinó · Standard frontlit molinó · 200 × 100 cm · Szegés + ringli',
        `   2 db · ${formatHuf(22860)}`,
        `   Fájl: logo.pdf (${formatFileSize(1_200_000)}): https://stiletdekor.example/api/uploads/${FILE_A}`,
        '2. Plakát · A2 · Matt · álló',
        '   Nincs feltöltött fájl: e-mailben küldi.',
        `   helyszin.jpg (${formatFileSize(830_000)}): https://stiletdekor.example/api/uploads/${FILE_B}`,
        'Átvétel, nettó: egyedi, a visszaigazoláskor adja meg',
        `Bruttó végösszeg: ${formatHuf(25400)}`,
        `Az ügyfél állapotoldala: https://stiletdekor.example/rendeles/${STATUS_TOKEN}`,
      ]),
    );
    expect(email.text).toContain('Felbontás: 150 DPI');
    expect(email.html).toContain(`<a href="https://stiletdekor.example/api/uploads/${FILE_A}">`);
    expect(email.html).toContain('<a href="tel:+36701234567">');
    expect(email.html).toContain('Hívjanak &lt;előtte&gt;.');
    expect(email.html).not.toContain('<előtte>');
  });
});
