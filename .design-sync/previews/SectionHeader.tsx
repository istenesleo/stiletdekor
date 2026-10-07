import { SectionHeader } from '@stiletdekor/ui';

export const Large = () => (
  <SectionHeader
    eyebrow="Webshop · azonnali ár"
    title="Rendelje meg online"
    lead="Méret, anyag, grafika: az árat és a határidőt azonnal látja."
  />
);

export const Small = () => <SectionHeader size="sm" level={3} eyebrow="Folyamat" title="Négy lépés, egy csapat" />;
