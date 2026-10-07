import { ButtonLink } from '@stiletdekor/ui';

export const Primary = () => <ButtonLink href="#ajanlat">Ajánlatot kérek</ButtonLink>;

export const Variants = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <ButtonLink href="#webshop" variant="secondary" icon="arrow-right" iconPosition="end">
      Webshop megnyitása
    </ButtonLink>
    <ButtonLink href="#referenciak" variant="ghost">
      Referenciák
    </ButtonLink>
    <ButtonLink href="tel:+36705385030" variant="link" icon="phone">
      +36 70 538 5030
    </ButtonLink>
  </div>
);
