import { useState } from 'react';
import { FitPicker } from '@stiletdekor/ui';

export const FillOrFit = () => {
  const [fit, setFit] = useState<'fill' | 'fit'>('fill');
  return <FitPicker value={fit} onChange={setFit} />;
};
