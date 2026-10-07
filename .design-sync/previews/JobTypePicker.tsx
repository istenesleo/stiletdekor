import { useState } from 'react';
import { JobTypePicker } from '@stiletdekor/ui';

export const AllJobTypes = () => {
  const [type, setType] = useState('kirakat');
  return (
    <JobTypePicker
      types={[
        { id: 'autofoliazas', name: 'Autófóliázás, flotta-dekor', hint: 'Feliratok, részleges vagy teljes dekor egy járműre vagy egész flottára.' },
        { id: 'kirakat', name: 'Kirakat- és üvegfóliázás', hint: 'Dekor, homokfúvott hatású, fényvédő vagy one way vision fólia kirakatra, üvegfelületre.' },
        { id: 'ceger', name: 'Cégér, reklámtábla', hint: 'Cégér vagy reklámtábla, igény szerint vázszerkezettel és világítással.' },
        { id: 'betuk', name: 'Világító és plasztik betűk, logók', hint: 'Térhatású betűk és logók, elő- vagy hátvilágítással, vagy világítás nélkül.' },
        { id: 'led-fal', name: 'LED-fal', hint: 'Bel- vagy kültéri LED-fal vásárlásra vagy rendezvényre bérelve.' },
        { id: 'rendezveny', name: 'Rendezvény díszlet, fotófal', hint: 'Díszlet, fotófal és rendezvénydekor, igény szerint felépítéssel és bontással.' },
        { id: 'kinalopult', name: 'Kínálópult fóliázás és telepítés', hint: 'Promóciós és kínálópultok fóliázása, helyszíni telepítéssel.' },
        { id: '3d-nyomtatas', name: '3D nyomtatás', hint: 'Egyedi tárgyak, betűk és makettek 3D nyomtatással.' },
        { id: 'egyeb', name: 'Egyéb arculati megoldás', hint: 'Minden más egyedi reklám- és díszítési munka. Írja le, mire van szüksége.' },
      ]}
      value={type}
      onChange={setType}
    />
  );
};
