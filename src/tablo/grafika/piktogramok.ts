// The board's pictogram family (G2): one set of shapes on a 24×24 grid, drawn three ways by CSS (line, filled,
// blueprint; piktogram.css). Shapes with class "f" take the fill; class "m" marks measuring details.
import type { QuoteTypeId, ServiceGroupSlug, ShopProductId } from '@/domain/catalog';

export type PiktogramStilus = 'vonal' | 'kitoltott' | 'tervrajz';

export const PIKTOGRAM_STILUSOK: readonly { readonly id: PiktogramStilus; readonly label: string }[] = [
  { id: 'vonal', label: 'Vonalas' },
  { id: 'kitoltott', label: 'Kitöltött' },
  { id: 'tervrajz', label: 'Tervrajz' },
];

export const PIKTOGRAM_CSOPORT: Readonly<Record<ServiceGroupSlug, string>> = {
  foliazas: '<path class="f" d="M3 10h18v10H3z"/><circle cx="6.5" cy="6.5" r="3.5"/><path d="M10 6.5h11"/><path class="m" d="M7 20v-2M11 20v-2M15 20v-2M19 20v-2"/>',
  'ceger-vilagito-reklam': '<rect class="f" x="3" y="7" width="18" height="9" rx="1"/><path d="M7 11.5h10M8 16v5M16 16v5"/><path class="m" d="M5 3.5l1 1.5M12 2.5v2M19 3.5l-1 1.5"/>',
  nyomtatas: '<rect class="f" x="3" y="9" width="18" height="8" rx="1"/><path d="M7 9V3h10v6M7 14h10v7H7z"/><path class="m" d="M9 17.5h6M9 19.5h4"/>',
  'rendezveny-egyedi': '<path class="f" d="M4 4h16v12H4z"/><path d="M4 16v5M20 16v5M2 21h20"/><path class="m" d="M12 7.5v5M9.5 10h5"/>',
};

export const PIKTOGRAM_MUNKA: Readonly<Record<QuoteTypeId, string>> = {
  autofoliazas: '<path class="f" d="M2 17V8h12l4 4h4v5z"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M14 8v4h4"/><path class="m" d="M4 11h7"/>',
  kirakat: '<rect x="3" y="4" width="18" height="16"/><path class="f" d="M3 10h18v4H3z"/><path d="M12 4v16"/><path class="m" d="M6 7l2-2M15 18l3-3"/>',
  ceger: '<rect class="f" x="3" y="5" width="18" height="8"/><path d="M7 9h10M6 13v8M18 13v8"/>',
  betuk: '<path class="f" d="M3 19h18v2H3z"/><path d="M6 19 11 4h2l5 15M8.3 13h7.4"/><path class="m" d="M3 8l2 1M21 8l-2 1M12 1v1.5"/>',
  'led-fal': '<rect class="f" x="3" y="4" width="18" height="12"/><path d="M9 4v12M15 4v12M3 10h18M12 16v4M8 20h8"/>',
  rendezveny: '<path class="f" d="M3 4h18v14H3z"/><path d="M3 18v3M21 18v3"/><path class="m" d="M7 8h.01M12 8h.01M17 8h.01M9.5 12h.01M14.5 12h.01"/>',
  kinalopult: '<path d="M2 8h20"/><path class="f" d="M4 8h16v12H4z"/><path d="M4 13h16"/><path class="m" d="M8 17h8"/>',
  '3d-nyomtatas': '<path class="f" d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  egyeb: '<circle class="f" cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>',
};

export const PIKTOGRAM_TERMEK: Readonly<Record<ShopProductId, string>> = {
  molino: '<rect class="f" x="2" y="6" width="20" height="11"/><path class="m" d="M4.5 8.5h.01M12 8.5h.01M19.5 8.5h.01M4.5 14.5h.01M12 14.5h.01M19.5 14.5h.01"/>',
  rollup: '<rect class="f" x="8" y="2" width="8" height="16"/><path d="M6 18h12v2H6zM9 20l-2 2M15 20l2 2"/>',
  matrica: '<path class="f" d="M4 4h16v10l-6 6H4z"/><path d="M20 14h-6v6"/>',
  plakat: '<rect class="f" x="6" y="2" width="12" height="17"/><path d="M8.5 6h7M8.5 9h4M8.5 15h7"/><path class="m" d="M6 22h12M6 21v2M18 21v2"/>',
  tabla: '<rect class="f" x="3" y="6" width="18" height="12"/><path class="m" d="M5.5 8.5h.01M18.5 8.5h.01M5.5 15.5h.01M18.5 15.5h.01"/>',
  vaszonkep: '<rect x="4" y="4" width="16" height="16"/><path class="f" d="M4 17l5-6 4 4 3-3 4 5v3H4z"/><path class="m" d="M20 4l2 2v16l-2-2"/>',
};
