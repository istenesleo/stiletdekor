import { useState } from 'react';
import { QuantityStepper } from '@stiletdekor/ui';

export const WithDiscountHelp = () => {
  const [qty, setQty] = useState(2);
  return <QuantityStepper value={qty} onChange={setQty} help="2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%" />;
};

export const AtTheLimit = () => {
  const [qty, setQty] = useState(1);
  return <QuantityStepper label="Készletek száma" value={qty} onChange={setQty} min={1} max={20} />;
};

export const Disabled = () => <QuantityStepper value={1} onChange={() => {}} disabled />;
