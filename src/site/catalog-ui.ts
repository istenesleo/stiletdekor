// Turns catalog data (src/domain) into the props of the UI library's components (src/ui). The UI stays
// presentational; prices become gross here, as everywhere on the site.
import type { AreaMaterial } from '@/domain/catalog';
import { formatNumberHu } from '@/domain/money';
import { grossOf } from '@/domain/pricing';
import type { MaterialOption, MaterialTexture } from '@/ui';

/** Swatch per catalog material id (molinó, matrica, tábla). */
const TEXTURES: Readonly<Record<string, MaterialTexture>> = {
  standard: 'frontlit',
  mesh: 'mesh',
  blockout: 'blockout',
  textil: 'textile',
  monomer: 'vinyl',
  polimer: 'vinyl',
  'one-way-vision': 'perforated',
  'pvc-3mm': 'foam',
  'pvc-5mm': 'foam',
  'dibond-3mm': 'dibond',
  'plexi-3mm': 'plexi',
};

const range = (min: number, max: number) =>
  min === max ? formatNumberHu(min) : `${formatNumberHu(min)}–${formatNumberHu(max)}`;

/** The data sheet rows of a material: weight or thickness, where it can be used, expected lifetime. */
export function materialSpecs(m: AreaMaterial): Array<readonly [string, string]> {
  const specs: Array<readonly [string, string]> = [];
  if (m.grammageGsm) specs.push(['Súly', `${range(m.grammageGsm.min, m.grammageGsm.max)} g/m²`]);
  if (m.thicknessMm !== null) specs.push(['Vastagság', `${formatNumberHu(m.thicknessMm)} mm`]);
  const use = m.use.indoor && m.use.outdoor ? 'kül- és beltér' : m.use.outdoor ? 'kültér' : 'beltér';
  specs.push(['Felhasználás', use]);
  if (m.lifespan) specs.push(['Élettartam', `≈ ${range(m.lifespan.minYears, m.lifespan.maxYears)} év ${m.lifespan.context}*`]);
  return specs;
}

/** A catalog material as a MaterialPicker option, with its gross price per m². */
export function materialOption(m: AreaMaterial): MaterialOption {
  return { id: m.id, name: m.name, price: grossOf(m.priceNetPerM2), unit: 'm2', specs: materialSpecs(m), texture: TEXTURES[m.id] };
}
