import { useState } from 'react';
import { Switch } from '@stiletdekor/ui';

export const Express = () => {
  const [express, setExpress] = useState(true);
  return (
    <Switch label="Expressz gyártás" description="1 munkanap, +30%" checked={express} onChange={(e) => setExpress(e.target.checked)} />
  );
};

export const Disabled = () => <Switch label="Telepítés" description="Csak Budapesten és Pest megyében." disabled />;
