import { describe, expect, it } from 'vitest';
import { quoteEmail } from './email';
import type { StoredQuote } from './store';

const QUOTE: StoredQuote = {
  id: 142,
  quoteType: 'kirakat',
  fields: { feluletM2: 12.5, foliaTipus: ['dekor', 'one-way-vision'] },
  emailedFiles: ['kirakatFotok'],
  location: 'Budapest, Minta utca 1.',
  deadline: '2026-11-15',
  surveyRequested: true,
  contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: 'Minta Kft.' },
  source: '/ajanlatkeres/kirakat',
  createdAt: '2026-10-09T08:00:00.000Z',
};

describe('quoteEmail', () => {
  it('names the reference, the job and the customer in the subject, and answers to the customer', () => {
    expect(quoteEmail(QUOTE, 'muhely@example.com')).toMatchObject({
      to: 'muhely@example.com',
      subject: '[AK-0142] Ajánlatkérés – Kirakat- és üvegfóliázás – Minta Mária',
      replyTo: 'maria@example.hu',
    });
  });

  it('writes the answers as the form asked them, with units and option names', () => {
    const lines = quoteEmail(QUOTE, 'm@example.com').text.split('\n');
    expect(lines.slice(0, 2)).toEqual(['Ajánlatkérés érkezett a weboldalon.', '']);
    expect(lines).toContain('Munka: Kirakat- és üvegfóliázás');
    expect(lines).toContain('Hivatkozási szám: AK-0142');
    expect(lines).toContain('Felület: 12,5 m²');
    expect(lines).toContain('Fólia típusa: Dekor, One way vision');
    expect(lines).toContain('E-mailben küldi: Fotó a kirakatról');
    expect(lines).toContain('Helyszín: Budapest, Minta utca 1.');
    expect(lines).toContain('Határidő: 2026. 11. 15.');
    expect(lines).toContain('Helyszíni felmérés: kéri');
    expect(lines).toContain('Cég: Minta Kft.');
    expect(lines).toContain('Beérkezett: 2026. 10. 09. 10:00');
  });

  it('links the phone and the e-mail address', () => {
    const { html } = quoteEmail(QUOTE, 'm@example.com');
    expect(html).toContain('<a href="tel:06301234567">06 30 123 4567</a>');
    expect(html).toContain('<a href="mailto:maria@example.hu">maria@example.hu</a>');
  });
});
