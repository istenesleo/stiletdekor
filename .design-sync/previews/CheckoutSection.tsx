import { useState } from 'react';
import { CheckoutSection, OptionRow, TextField } from '@stiletdekor/ui';

export const ContactDetails = () => (
  <CheckoutSection step={1} title="Adatok">
    <TextField label="Név" autoComplete="name" required />
    <TextField label="E-mail" type="email" autoComplete="email" required />
    <TextField label="Telefon" type="tel" autoComplete="tel" help="Erre a számra hívjuk vissza." />
  </CheckoutSection>
);

export const Delivery = () => {
  const [delivery, setDelivery] = useState('pickup');
  return (
    <CheckoutSection step={2} title="Átvétel" description="A futár és a telepítés díja a visszaigazolásban véglegesedik.">
      <OptionRow name="delivery" label="Személyes átvétel a műhelyben" description="Budapest, Schweidel József u. 1–3." amount={0} checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />
      <OptionRow name="delivery" label="Futár" description="Nagy csomag (roll-up, tábla): 6 337 Ft" amount={3797} checked={delivery === 'courier'} onChange={() => setDelivery('courier')} />
      <OptionRow name="delivery" label="Telepítéssel" description="A helyszínen felszereljük." amountText="egyedi" checked={delivery === 'install'} onChange={() => setDelivery('install')} />
    </CheckoutSection>
  );
};
