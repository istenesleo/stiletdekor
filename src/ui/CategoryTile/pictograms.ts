// Product pictograms on a 48×36 grid, drawn like the icons (stroke, current color).
export const PRODUCT_PICTOGRAMS = {
  molino:
    '<rect x="4" y="8" width="40" height="20"/><circle cx="7.5" cy="11.5" r="1.3"/><circle cx="40.5" cy="11.5" r="1.3"/><circle cx="7.5" cy="24.5" r="1.3"/><circle cx="40.5" cy="24.5" r="1.3"/><circle cx="24" cy="11.5" r="1.3"/><circle cx="24" cy="24.5" r="1.3"/>',
  rollup: '<rect x="16" y="3" width="16" height="26"/><path d="M13 29h22v3H13zM18 32l-3 2M30 32l3 2"/>',
  matrica: '<path d="M9 6h30v17l-11 11H9z"/><path d="M39 23H28v11"/>',
  plakat: '<rect x="13" y="3" width="22" height="30"/><path d="M17 9h14M17 13h9M17 27h14"/>',
  tabla:
    '<rect x="5" y="7" width="38" height="22"/><circle cx="9" cy="11" r="1.4"/><circle cx="39" cy="11" r="1.4"/><circle cx="9" cy="25" r="1.4"/><circle cx="39" cy="25" r="1.4"/>',
  vaszon: '<path d="M9 5h28v25H9z"/><path d="M37 5l3 3v25l-3-3M9 30l3 3h28"/><path d="M13 25l7-8 5 5 4-4 5 7"/>',
} as const;

export type ProductKind = keyof typeof PRODUCT_PICTOGRAMS;
export const PRODUCT_KINDS = Object.keys(PRODUCT_PICTOGRAMS) as ProductKind[];
