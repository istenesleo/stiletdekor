import { useState } from 'react';
import { OptionRow } from '@stiletdekor/ui';

export const EdgeFinish = () => {
  const [edge, setEdge] = useState('hem');
  const options = [
    { id: 'cut', label: 'Méretre vágás', description: 'Egyenesre vágott szél.', rate: 0, amount: 0 },
    { id: 'ringli', label: 'Ringli 50 cm-enként', description: 'Fém fűzőlyuk a szélen, kötözéshez.', rate: 254, amount: 1524 },
    { id: 'hem', label: 'Szegés + ringli', description: 'Megerősített, szegett szél, ringli 50 cm-enként.', rate: 445, amount: 2670 },
  ];
  return (
    <fieldset style={{ display: 'grid', gap: 'var(--space-2)', margin: 0, padding: 0, border: 0 }}>
      <legend className="sd-caps" style={{ marginBottom: 'var(--space-3)' }}>
        Szélkidolgozás
      </legend>
      {options.map((o) => (
        <OptionRow
          key={o.id}
          name="edge"
          value={o.id}
          label={o.label}
          description={o.description}
          rate={o.rate}
          rateUnit="fm"
          amount={o.amount}
          checked={edge === o.id}
          onChange={() => setEdge(o.id)}
        />
      ))}
    </fieldset>
  );
};

export const AddOns = () => {
  const [contour, setContour] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <OptionRow
        type="checkbox"
        label="Kontúrvágás"
        description="A grafika körvonala mentén vágjuk."
        rate={2540}
        rateUnit="m²"
        amount={635}
        checked={contour}
        onChange={(e) => setContour(e.target.checked)}
      />
      <OptionRow type="checkbox" label="Telepítés" description="A helyszínen felszereljük." amountText="egyedi" />
      <OptionRow type="checkbox" label="UV-laminálás" description="Most nem rendelhető." disabled />
    </div>
  );
};
