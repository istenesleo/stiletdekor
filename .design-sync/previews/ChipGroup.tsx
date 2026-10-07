import { useState } from 'react';
import { ChipGroup } from '@stiletdekor/ui';

export const SizePresets = () => {
  const [size, setSize] = useState('200x100');
  return (
    <ChipGroup
      legend="Gyakori méretek (cm)"
      options={[
        { value: '100x50', label: '100×50' },
        { value: '200x100', label: '200×100' },
        { value: '300x100', label: '300×100' },
        { value: '400x200', label: '400×200' },
        { value: '500x100', label: '500×100' },
      ]}
      value={size}
      onChange={setSize}
    />
  );
};
