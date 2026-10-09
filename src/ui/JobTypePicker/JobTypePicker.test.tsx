/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JobTypePicker } from './JobTypePicker';
import { JOB_PICTOGRAMS } from './pictograms';

const TYPES = [
  { id: 'kirakat', name: 'Kirakat- és üvegfóliázás', hint: 'Dekor, fényvédő vagy one way vision fólia.' },
  { id: 'ceger', name: 'Cégér, reklámtábla' },
  { id: 'uj-tipus', name: 'Valami új' },
];

describe('JobTypePicker', () => {
  it('is a radio group of job types; picking one reports its id', () => {
    const onChange = vi.fn();
    render(<JobTypePicker types={TYPES} value="ceger" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Milyen munkáról van szó?' })).toBeTruthy();
    const kirakat = screen.getByRole('radio', { name: 'Kirakat- és üvegfóliázás Dekor, fényvédő vagy one way vision fólia.' });
    expect((screen.getByRole('radio', { name: 'Cégér, reklámtábla' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(kirakat);
    expect(onChange).toHaveBeenCalledWith('kirakat');
  });

  it('draws each type with its pictogram, an unknown one with the "other" pictogram', () => {
    const { container } = render(<JobTypePicker types={TYPES} onChange={() => {}} />);
    // Serialized the way the DOM does it (<rect></rect>, not <rect/>).
    const serialize = (markup: string) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.innerHTML = markup;
      return svg.innerHTML;
    };
    const picts = [...container.querySelectorAll('.sd-job__pict')].map((svg) => svg.innerHTML);
    expect(picts).toEqual([JOB_PICTOGRAMS.kirakat, JOB_PICTOGRAMS.ceger, JOB_PICTOGRAMS.egyeb].map(serialize));
  });

  it('links each type to its own page instead of a radio group, so it works without JavaScript', () => {
    render(<JobTypePicker types={TYPES} hrefFor={(id) => `/ajanlatkeres/${id}`} />);
    expect(screen.queryAllByRole('radio')).toEqual([]);
    const link = screen.getByRole('link', { name: /Kirakat- és üvegfóliázás/ });
    expect(link.getAttribute('href')).toBe('/ajanlatkeres/kirakat');
    expect(screen.getAllByRole('link')).toHaveLength(TYPES.length);
  });
});
