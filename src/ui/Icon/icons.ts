// Line icons on a 24×24 grid, drawn with the current text color (stroke, no fill). Shared look with the
// mockups: 1.7 px stroke, square-ish joins. Keep the set small; add an icon only when a component needs it.
export const ICONS = {
  'arrow-right': '<path d="M4 12h15M13 6l6 6-6 6"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cart: '<path d="M2.5 4h2.8l2.3 10.5h10.8L21 7.5H6.4"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.4"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="m3 6 9 7 9-7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  minus: '<path d="M5 12h14"/>',
  phone:
    '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
  pin: '<path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  success: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  swap: '<path d="M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  warning: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v5M12 17.6v.4"/>',
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
