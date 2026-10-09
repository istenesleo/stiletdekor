import { describe, expect, it } from 'vitest';
import { parseNumberHu, parseQuoteForm } from './form';

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe('parseNumberHu', () => {
  it('reads a decimal comma or point, and leaves an unreadable text as text', () => {
    expect(parseNumberHu('12,5')).toBe(12.5);
    expect(parseNumberHu(' 1 200 ')).toBe(1200);
    expect(parseNumberHu('3.75')).toBe(3.75);
    expect(parseNumberHu('')).toBeNull();
    expect(parseNumberHu('kb. 12')).toBe('kb. 12');
  });
});

describe('parseQuoteForm', () => {
  it('turns the posted fields into the shape of the quote schema, and keeps what was typed', () => {
    const { request, values } = parseQuoteForm(
      'kirakat',
      form([
        ['f_feluletM2', '12,5'],
        ['f_meretek', ''],
        ['f_foliaTipus', 'dekor'],
        ['f_foliaTipus', 'one-way-vision'],
        ['f_kirakatFotok__email', 'on'],
        ['location', 'Budapest, Minta utca 1.'],
        ['deadline', ''],
        ['name', 'Minta Mária'],
        ['email', 'maria@example.hu'],
        ['phone', '06 30 123 4567'],
        ['company', ''],
        ['surveyRequested', 'on'],
        ['source', '/ajanlatkeres/kirakat'],
      ]),
    );
    expect(request).toEqual({
      quoteType: 'kirakat',
      fields: { feluletM2: 12.5, meretek: '', foliaTipus: ['dekor', 'one-way-vision'] },
      emailedFiles: ['kirakatFotok'],
      location: 'Budapest, Minta utca 1.',
      deadline: undefined,
      surveyRequested: true,
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: '' },
      source: '/ajanlatkeres/kirakat',
    });
    expect(values).toMatchObject({ f_feluletM2: '12,5', f_foliaTipus: ['dekor', 'one-way-vision'], f_kirakatFotok__email: 'on', surveyRequested: 'on' });
  });

  it('drops a source that is not a path of the site', () => {
    expect(parseQuoteForm('egyeb', form([['source', 'https://example.com']])).request.source).toBeUndefined();
  });
});
