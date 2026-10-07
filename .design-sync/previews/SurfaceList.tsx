import { useState } from 'react';
import { SurfaceList } from '@stiletdekor/ui';

export const WindowFilmPackage = () => {
  const [sets, setSets] = useState(2);
  const [surfaces, setSurfaces] = useState([
    { id: 'a', label: 'Bejárati ajtó', pages: [1, 3], widthMm: 900, heightMm: 2100, count: 2 },
    { id: 'b', label: 'Kirakat, bal', pages: [2], widthMm: 2400, heightMm: 1800, count: 1 },
    { id: 'c', label: 'Kirakat, jobb', pages: [4], widthMm: 2400, heightMm: 1800, count: 1 },
    { id: 'd', label: 'Nyitvatartás-matrica', pages: [5], widthMm: 300, heightMm: 400, count: 1, skipped: true },
  ]);
  return (
    <SurfaceList
      surfaces={surfaces}
      sets={sets}
      onSetsChange={setSets}
      onToggleSkip={(id) => setSurfaces((list) => list.map((s) => (s.id === id ? { ...s, skipped: !s.skipped } : s)))}
    />
  );
};
