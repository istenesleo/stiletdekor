import { Badge, CartLine } from '@stiletdekor/ui';

export const WithArtwork = () => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><rect y="150" width="400" height="50" fill="#f2c230"/><text x="28" y="100" font-family="Arial" font-size="56" font-weight="700" fill="#fff">NYITÁS</text></svg>',
    );
  return <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 3 db" price={36494} thumbnailUrl={artwork} onRemove={() => {}} />;
};

export const WithPictogramAndBadge = () => (
  <CartLine
    title="Roll-up · teljes"
    spec="85×200 cm · táskával · 1 db"
    price={31623}
    product="rollup"
    badges={<Badge tone="brand">Expressz</Badge>}
    onRemove={() => {}}
  />
);

export const ReadOnly = () => <CartLine title="Matrica · monomer" spec="50×30 cm · kontúrvágással · 10 db" price={8877} product="matrica" />;
