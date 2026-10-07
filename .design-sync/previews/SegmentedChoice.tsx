import { useState } from 'react';
import { SegmentedChoice } from '@stiletdekor/ui';

export const FileScale = () => {
  const [scale, setScale] = useState('1');
  return (
    <SegmentedChoice
      legend="A fájl méretaránya"
      options={[
        { value: '1', label: '1:1', description: 'valós méret' },
        { value: '10', label: '1:10', description: 'tízszeresre nagyítjuk' },
        { value: 'x', label: 'Egyéb', description: 'megadom a méretet' },
      ]}
      value={scale}
      onChange={setScale}
    />
  );
};

export const Compact = () => {
  const [side, setSide] = useState('one');
  return (
    <SegmentedChoice
      legend="Nyomtatás"
      options={[
        { value: 'one', label: 'Egyoldalas' },
        { value: 'two', label: 'Kétoldalas' },
      ]}
      value={side}
      onChange={setSide}
    />
  );
};
