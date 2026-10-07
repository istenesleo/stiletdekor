import { TextLink } from '@stiletdekor/ui';

export const InText = () => (
  <p style={{ margin: 0 }}>
    A rendeléssel elfogadja az <TextLink href="/aszf">ÁSZF-et</TextLink> és az{' '}
    <TextLink href="/adatkezeles">adatkezelési tájékoztatót</TextLink>.
  </p>
);

export const External = () => (
  <p style={{ margin: 0 }}>
    A műhely útvonala a{' '}
    <TextLink href="https://www.google.com/maps/search/?api=1&query=Budapest%2C%20Schweidel%20J%C3%B3zsef%20u.%201" external>
      térképen
    </TextLink>
    .
  </p>
);
