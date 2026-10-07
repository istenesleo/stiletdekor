import type { HTMLAttributes, ReactNode } from 'react';
import { COMPANY } from '@/domain/company';
import '../base.css';
import { cx } from '../cx';
import { FOOTER_COLUMNS, type FooterColumn, LEGAL_NAV, type NavItem } from '../navigation';
import { Wordmark } from '../Wordmark/Wordmark';
import './SiteFooter.css';

export interface SiteFooterProps extends HTMLAttributes<HTMLElement> {
  /** Link columns before the contact column; the site's services and ordering links by default. */
  columns?: readonly FooterColumn[];
  /** Legal pages in the bottom row: ÁSZF, Adatkezelési tájékoztató, Impresszum by default. */
  legal?: readonly NavItem[];
  /** One line about what we do, under the wordmark. */
  tagline?: ReactNode;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Year in the copyright line, the current year by default. */
  year?: number;
}

/**
 * The site footer: wordmark, link columns, the workshop's contacts and the legal links.
 * Contacts: phone, e-mail, address, opening hours. The bottom row carries the copyright line.
 * @category content
 */
export function SiteFooter({
  columns = FOOTER_COLUMNS,
  legal = LEGAL_NAV,
  tagline = 'Fóliázás, cégér és világító reklám, nyomtatás, rendezvény. Helyszíni felméréssel és telepítéssel.',
  homeHref = '/',
  year = new Date().getFullYear(),
  className,
  ...rest
}: SiteFooterProps) {
  return (
    <footer className={cx('sd-footer', className)} {...rest}>
      <div className="sd-footer__inner">
        <div className="sd-footer__cols">
          <div className="sd-footer__brand">
            <Wordmark href={homeHref} />
            {tagline && <p className="sd-footer__tagline">{tagline}</p>}
          </div>
          {columns.map((column) => (
            <div key={column.title} className="sd-footer__col">
              <h2 className="sd-footer__title sd-caps">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="sd-footer__col">
            <h2 className="sd-footer__title sd-caps">Kapcsolat</h2>
            <address>
              <ul>
                <li>
                  <a className="sd-footer__phone" href={COMPANY.phone.href}>
                    {COMPANY.phone.display}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
                </li>
                <li>{COMPANY.address}</li>
                <li className="sd-footer__muted">{COMPANY.openingHours}</li>
              </ul>
            </address>
          </div>
        </div>
        <div className="sd-footer__base">
          <p>
            © {year} {COMPANY.name}
          </p>
          {legal.length > 0 && (
            <ul className="sd-footer__legal">
              {legal.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
