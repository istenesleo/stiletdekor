// The site's menus: the defaults of SiteHeader and SiteFooter. Until the pages get their own routes, the items
// point at sections of the home page, so they work from any page.

/** A menu item. */
export interface NavItem {
  href: string;
  label: string;
}

/** A titled group of links in the footer. */
export interface FooterColumn {
  title: string;
  links: readonly NavItem[];
}

/** The webshop's entry. */
export const WEBSHOP_HREF = '/#webshop';

/** The main menu in the header. */
export const MAIN_NAV: readonly NavItem[] = [
  { href: '/#szolgaltatasok', label: 'Szolgáltatások' },
  { href: WEBSHOP_HREF, label: 'Webshop' },
  { href: '/#referenciak', label: 'Referenciák' },
  { href: '/#folyamat', label: 'Folyamat' },
  { href: '/#rolunk', label: 'Rólunk' },
  { href: '/#kapcsolat', label: 'Kapcsolat' },
];

/** Where "Ajánlatkérés" leads: the quote wizard. */
export const QUOTE_HREF = '/#ajanlat';

/** The quick callback form. */
export const CALLBACK_HREF = '/visszahivas';

/** The footer's link columns; the contact column comes from the company data. */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Szolgáltatások',
    links: [
      { href: '/#foliazas', label: 'Fóliázás' },
      { href: '/#ceger-vilagito-reklam', label: 'Cégér és világító reklám' },
      { href: '/#nyomtatas', label: 'Nyomtatás' },
      { href: '/#rendezveny-egyedi', label: 'Rendezvény és egyedi' },
    ],
  },
  {
    title: 'Rendelés',
    links: [
      { href: WEBSHOP_HREF, label: 'Webshop' },
      { href: QUOTE_HREF, label: 'Egyedi ajánlat' },
      { href: CALLBACK_HREF, label: 'Visszahívást kérek' },
      { href: '/#referenciak', label: 'Referenciák' },
    ],
  },
];

/** Legal pages, linked at the bottom of every page. */
export const LEGAL_NAV: readonly NavItem[] = [
  { href: '/aszf', label: 'ÁSZF' },
  { href: '/adatkezeles', label: 'Adatkezelési tájékoztató' },
  { href: '/impresszum', label: 'Impresszum' },
];
