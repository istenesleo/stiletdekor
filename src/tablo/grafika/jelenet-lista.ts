// The illustrated reference placeholders (G1), from docs/brief.md ch. 7. One scale for all of them: 1 unit = 2 cm,
// so the 180 cm figure is the same size in every scene. Real portfolio photos replace them on the live site.

export type JelenetId = 'kirakat-ejjel' | 'kisbusz' | 'rollup' | 'fotofal' | 'ledfal' | 'uvegfolia' | 'kinalopult' | 'betuk-3d';

export interface JelenetInfo {
  readonly id: JelenetId;
  readonly name: string;
  /** Text alternative: what the illustration shows. */
  readonly desc: string;
  /** Lit work: the scene has a night view. */
  readonly night: boolean;
  /** Component file in src/tablo/grafika/jelenetek/. */
  readonly file: string;
}

export const JELENETEK: readonly JelenetInfo[] = [
  {
    id: 'kirakat-ejjel', name: 'Kirakat világító betűkkel', night: true, file: 'KirakatEjjel.astro',
    desc: 'Üzletportál fölött 4200 mm széles cégértábla világító betűkkel, alatta kirakat és bejárat, a járdán egy 180 cm magas alak.',
  },
  {
    id: 'kisbusz', name: 'Fóliázott kisbusz', night: false, file: 'Kisbusz.astro',
    desc: 'Oldalnézetből egy kisbusz, az oldalán átlós dekorcsík és feliratsáv, mellette egy 180 cm magas alak.',
  },
  {
    id: 'rollup', name: 'Roll-upok rendezvényen', night: false, file: 'Rollup.astro',
    desc: 'Két 85×200 cm-es roll-up egymás mellett méretvonalakkal, mellettük egy 180 cm magas alak.',
  },
  {
    id: 'fotofal', name: 'Fotófal', night: false, file: 'Fotofal.astro',
    desc: 'Mintás, 300×220 cm-es fotófal, előtte két 180 cm magas alak.',
  },
  {
    id: 'ledfal', name: 'LED-fal színpadon', night: true, file: 'Ledfal.astro',
    desc: 'Színpad fölött 500×300 cm-es, panelekből álló LED-fal, a színpadon egy 180 cm magas alak.',
  },
  {
    id: 'uvegfolia', name: 'Homokfúvott hatású üvegfólia', night: true, file: 'Uvegfolia.astro',
    desc: 'Irodai üvegfal, rajta homokfúvott hatású fóliasáv kivágott felirattal, mellette egy 180 cm magas alak.',
  },
  {
    id: 'kinalopult', name: 'Fóliázott kínálópult', night: false, file: 'Kinalopult.astro',
    desc: 'Kínálópult fóliázott előlappal, mögötte polcok és egy 180 cm magas alak.',
  },
  {
    id: 'betuk-3d', name: '3D nyomtatott betűk', night: false, file: 'Betuk3d.astro',
    desc: 'Recepciós pult fölött a falon 60 cm magas, térhatású betűk, mellettük egy 180 cm magas alak.',
  },
];
