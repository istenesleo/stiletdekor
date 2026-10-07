import { useState } from 'react';
import { CategoryTile } from '@stiletdekor/ui';

export const AsLinks = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: 'var(--space-2)' }}>
    <CategoryTile product="molino" name="Molinó" price={5067} unit="m2" href="#molino" />
    <CategoryTile product="rollup" name="Roll-up" price={31623} href="#rollup" />
    <CategoryTile product="matrica" name="Matrica" price={8877} unit="m2" href="#matrica" />
    <CategoryTile product="plakat" name="Plakát" price={1257} href="#plakat" />
    <CategoryTile product="tabla" name="Tábla" price={12687} unit="m2" href="#tabla" />
    <CategoryTile product="vaszon" name="Vászonkép" price={10147} href="#vaszon" />
  </div>
);

export const AsSelector = () => {
  const [product, setProduct] = useState('molino');
  const tiles = [
    { product: 'molino' as const, name: 'Molinó', price: 5067, unit: 'm2' as const },
    { product: 'rollup' as const, name: 'Roll-up', price: 31623 },
    { product: 'tabla' as const, name: 'Tábla', price: 12687, unit: 'm2' as const },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', gap: 'var(--space-2)' }}>
      {tiles.map((t) => (
        <CategoryTile key={t.product} {...t} pressed={t.product === product} onClick={() => setProduct(t.product)} />
      ))}
    </div>
  );
};
