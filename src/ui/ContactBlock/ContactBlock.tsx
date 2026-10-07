import { type HTMLAttributes, useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/domain/company';
import '../base.css';
import { Button } from '../Button/Button';
import { ButtonLink } from '../ButtonLink/ButtonLink';
import { cx } from '../cx';
import './ContactBlock.css';

export interface ContactBlockProps extends HTMLAttributes<HTMLElement> {
  /** The workshop's number by default. */
  phone?: { display: string; href: string };
  /** The workshop's e-mail address by default. */
  email?: string;
  /** The workshop's address by default. */
  address?: string;
  /** Map link for the address, opened in a new tab; a map search for the address by default, null hides it. */
  mapHref?: string | null;
  /** The workshop's opening hours by default; null hides the row. */
  openingHours?: string | null;
}

type CopyKey = 'phone' | 'email' | 'address';

// What was copied, in the accusative: "A telefonszámot a vágólapra másoltuk."
const COPIED: Record<CopyKey, string> = { phone: 'A telefonszámot', email: 'Az e-mail-címet', address: 'A címet' };
const COPY_LABEL: Record<CopyKey, string> = { phone: 'telefonszám', email: 'e-mail-cím', address: 'cím' };

/**
 * The workshop's contacts with call, write, map and copy buttons, plus the opening hours.
 * Phone, e-mail and address are selectable text, for the contact section and the order confirmation. Copying
 * is announced to screen readers; where the clipboard is not available the text gets selected instead.
 * @category content
 */
export function ContactBlock({
  phone = COMPANY.phone,
  email = COMPANY.email,
  address = COMPANY.address,
  mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  openingHours = COMPANY.openingHours,
  className,
  ...rest
}: ContactBlockProps) {
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [message, setMessage] = useState('');
  const values = useRef<Partial<Record<CopyKey, HTMLElement | null>>>({});

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (key: CopyKey, text: string) => {
    try {
      if (!navigator.clipboard) throw new Error('No clipboard');
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setMessage(`${COPIED[key]} a vágólapra másoltuk.`);
    } catch {
      const value = values.current[key];
      if (value) window.getSelection()?.selectAllChildren(value);
      setCopied(null);
      setMessage(`${COPIED[key]} kijelöltük, most már kimásolhatja.`);
    }
  };

  const copyButton = (key: CopyKey, text: string) => (
    <Button variant="ghost" size="sm" icon={copied === key ? 'check' : 'copy'} onClick={() => void copy(key, text)}>
      {copied === key ? 'Másolva' : 'Másolás'}
      <span className="sd-vh">: {COPY_LABEL[key]}</span>
    </Button>
  );

  return (
    <address className={cx('sd-contact', className)} {...rest}>
      <dl className="sd-contact__list">
        <div className="sd-contact__row">
          <dt className="sd-caps">Telefon</dt>
          <dd>
            <span
              className="sd-contact__value sd-contact__value--phone"
              ref={(el) => {
                values.current.phone = el;
              }}
            >
              {phone.display}
            </span>
            <span className="sd-contact__actions">
              <ButtonLink variant="secondary" size="sm" icon="phone" href={phone.href}>
                Hívás
              </ButtonLink>
              {copyButton('phone', phone.display)}
            </span>
          </dd>
        </div>
        <div className="sd-contact__row">
          <dt className="sd-caps">E-mail</dt>
          <dd>
            <span
              className="sd-contact__value"
              ref={(el) => {
                values.current.email = el;
              }}
            >
              {email}
            </span>
            <span className="sd-contact__actions">
              <ButtonLink variant="secondary" size="sm" icon="mail" href={`mailto:${email}`}>
                Levél írása
              </ButtonLink>
              {copyButton('email', email)}
            </span>
          </dd>
        </div>
        <div className="sd-contact__row">
          <dt className="sd-caps">Műhely</dt>
          <dd>
            <span
              className="sd-contact__value"
              ref={(el) => {
                values.current.address = el;
              }}
            >
              {address}
            </span>
            <span className="sd-contact__actions">
              {mapHref && (
                <ButtonLink variant="secondary" size="sm" icon="pin" href={mapHref} target="_blank" rel="noopener noreferrer">
                  Térkép{' '}
                  <span className="sd-vh">(új lapon nyílik)</span>
                </ButtonLink>
              )}
              {copyButton('address', address)}
            </span>
          </dd>
        </div>
        {openingHours && (
          <div className="sd-contact__row">
            <dt className="sd-caps">Nyitvatartás</dt>
            <dd>
              <span className="sd-contact__value">{openingHours}</span>
            </dd>
          </div>
        )}
      </dl>
      <p className="sd-vh" role="status">
        {message}
      </p>
    </address>
  );
}
