import { useState } from 'react';
import { MaterialPicker } from '@stiletdekor/ui';

export const Banner = () => {
  const [material, setMaterial] = useState('standard');
  return (
    <MaterialPicker
      materials={[
        {
          id: 'standard',
          name: 'Standard frontlit molinó',
          price: 5067,
          unit: 'm2',
          texture: 'frontlit',
          specs: [
            ['Súly', '440–510 g/m²'],
            ['Felhasználás', 'kül- és beltér'],
            ['Élettartam', '≈ 1–3 év kültéren*'],
          ],
        },
        {
          id: 'mesh',
          name: 'Hálós (mesh) molinó',
          price: 5702,
          unit: 'm2',
          texture: 'mesh',
          specs: [
            ['Felhasználás', 'kültér'],
            ['Élettartam', '≈ 1–3 év kültéren*'],
          ],
        },
        {
          id: 'blockout',
          name: 'Blockout molinó',
          price: 8877,
          unit: 'm2',
          texture: 'blockout',
          specs: [
            ['Felhasználás', 'kül- és beltér'],
            ['Élettartam', '≈ 1–3 év kültéren*'],
          ],
        },
        { id: 'textil', name: 'Textil (zászlóanyag)', price: 6972, unit: 'm2', texture: 'textile', specs: [['Felhasználás', 'beltér']] },
      ]}
      value={material}
      onChange={setMaterial}
    />
  );
};

export const Board = () => {
  const [material, setMaterial] = useState('dibond-3mm');
  return (
    <MaterialPicker
      legend="Lemez"
      materials={[
        { id: 'pvc-3mm', name: 'PVC habtábla 3 mm', price: 12687, unit: 'm2', texture: 'foam', specs: [['Vastagság', '3 mm'], ['Felhasználás', 'beltér']] },
        { id: 'dibond-3mm', name: 'Dibond (alu kompozit) 3 mm', price: 25387, unit: 'm2', texture: 'dibond', specs: [['Vastagság', '3 mm'], ['Felhasználás', 'kül- és beltér']] },
        { id: 'plexi-3mm', name: 'Plexi 3 mm', price: 31737, unit: 'm2', texture: 'plexi', specs: [['Vastagság', '3 mm'], ['Felhasználás', 'kül- és beltér']] },
      ]}
      value={material}
      onChange={setMaterial}
    />
  );
};
