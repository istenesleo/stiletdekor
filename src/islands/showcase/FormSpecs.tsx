import { useState } from 'react';
import { MOLINO, TABLA } from '@/domain/catalog';
import type { FitMode } from '@/domain/preflight';
import { materialOption } from '@/site/catalog-ui';
import {
  Checkbox,
  ChipGroup,
  FileDrop,
  FileList,
  type FileListItem,
  FitPicker,
  MaterialPicker,
  OptionRow,
  QuantityStepper,
  SegmentedChoice,
  SizeFields,
  Switch,
  TextField,
  UnitField,
} from '@/ui';
import { Cell, Group, Spec } from './parts';

const EDGES = [
  { id: 'cut', label: 'Méretre vágás', description: 'Egyenesre vágott szél.', rate: 0, amount: 0 },
  { id: 'ringli', label: 'Ringli 50 cm-enként', description: 'Fém fűzőlyuk a szélen, kötözéshez.', rate: 254, amount: 1524 },
  { id: 'hem', label: 'Szegés + ringli', description: 'Megerősített, szegett szél, ringli 50 cm-enként.', rate: 445, amount: 2670 },
  { id: 'tunnel', label: 'Alagútvarrás (rúdhoz)', description: 'Felül és alul varrt csatorna rúdnak.', rate: 762, amount: 3048 },
];

const SIZE_PRESETS = [
  { value: '100x50', label: '100×50' },
  { value: '200x100', label: '200×100' },
  { value: '300x100', label: '300×100' },
  { value: '400x200', label: '400×200' },
  { value: '500x100', label: '500×100' },
];

const FILES: FileListItem[] = [
  { id: 'a', name: 'molino-ujranyitas-200x100.pdf', size: 2_400_000, detail: '2000×1000 mm · vektoros', status: 'ok', statusText: 'Méret felismerve' },
  { id: 'b', name: 'kirakat-elolrol.jpg', size: 830_000, detail: '4032×3024 px · 72 dpi', status: 'warn', statusText: 'Ellenőrizze a felbontást' },
  { id: 'c', name: 'regi-logo.cdr', size: 12_600_000, status: 'error', statusText: 'Ebből nem olvasunk méretet' },
  { id: 'd', name: 'plakat-a2.tif', size: 48_000_000, status: 'pending' },
];

/** Form controls with working state. */
export function FormSpecs() {
  const [express, setExpress] = useState(false);
  const [width, setWidth] = useState('200');
  const [height, setHeight] = useState('100');
  const [qty, setQty] = useState(2);
  const [preset, setPreset] = useState('200x100');
  const [scale, setScale] = useState('1');
  const [fit, setFit] = useState<FitMode>('fill');
  const [edge, setEdge] = useState('hem');
  const [contour, setContour] = useState(true);
  const [banner, setBanner] = useState('standard');
  const [board, setBoard] = useState('dibond-3mm');
  const [files, setFiles] = useState(FILES);

  return (
    <>
      <Group id="urlap" title="Űrlap" />
      <Spec title="Szövegmező · TextField">
        <Cell caption="alap, kötelező">
          <TextField label="Név" autoComplete="name" required />
        </Cell>
        <Cell caption="súgóval">
          <TextField label="Telefon" type="tel" autoComplete="tel" help="Erre a számra hívjuk vissza." defaultValue="+36 30 123 4567" />
        </Cell>
        <Cell caption="hiba">
          <TextField label="E-mail" type="email" autoComplete="email" required defaultValue="maria@" error="Adjon meg érvényes e-mail-címet." />
        </Cell>
        <Cell caption="tiltott">
          <TextField label="Cégnév" disabled defaultValue="Minta Kft." />
        </Cell>
        <Cell caption="több soros">
          <TextField label="Megjegyzés" multiline placeholder="pl. mikor érhető el telefonon" />
        </Cell>
      </Spec>

      <Spec title="Jelölőnégyzet · Checkbox · Kapcsoló · Switch">
        <Cell caption="jelölőnégyzet">
          <div className="uis-stack">
            <Checkbox label="Helyszíni felmérést kérek" description="Kimegyünk, lemérjük a felületet, és utána küldjük a pontos ajánlatot." defaultChecked />
            <Checkbox label="Hírlevelet kérek" disabled />
          </div>
        </Cell>
        <Cell caption="hiba">
          <Checkbox label="Elfogadom az ÁSZF-et" required error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés." />
        </Cell>
        <Cell caption="kapcsoló">
          <div className="uis-stack">
            <Switch label="Expressz gyártás" description="1 munkanap, +30%" checked={express} onChange={(e) => setExpress(e.target.checked)} />
            <Switch label="Tiltott" disabled />
          </div>
        </Cell>
      </Spec>

      <Spec title="Méretmezők · UnitField, SizeFields · Darabszám · QuantityStepper" wide>
        <Cell caption="méretpár cserével, a fájlból">
          <SizeFields
            width={width}
            height={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            onSwap={() => {
              setWidth(height);
              setHeight(width);
            }}
            fromFile
          />
        </Cell>
        <Cell caption="hiba">
          <SizeFields width="620" height="100" onWidthChange={() => {}} onHeightChange={() => {}} error="A szélesség legfeljebb 500 cm lehet." />
        </Cell>
        <Cell caption="egy mező">
          <UnitField label="Betűmagasság" unit="mm" defaultValue="350" />
        </Cell>
        <Cell caption="darabszám">
          <QuantityStepper value={qty} onChange={setQty} help="2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%" />
        </Cell>
      </Spec>

      <Spec title="Választók · ChipGroup, SegmentedChoice, FitPicker" wide>
        <Cell caption="méretsablonok">
          <ChipGroup legend="Gyakori méretek (cm)" options={SIZE_PRESETS} value={preset} onChange={setPreset} />
        </Cell>
        <Cell caption="méretarány (csak ha indokolt)">
          <SegmentedChoice
            legend="A fájl méretaránya"
            options={[
              { value: '1', label: '1:1', description: 'valós méret' },
              { value: '10', label: '1:10', description: 'tízszeresre nagyítjuk' },
              { value: 'x', label: 'Egyéb', description: 'megadom a méretet' },
            ]}
            value={scale}
            onChange={setScale}
          />
        </Cell>
        <Cell caption="arányeltérés">
          <FitPicker value={fit} onChange={setFit} />
        </Cell>
      </Spec>

      <Spec title="Opciósor · OptionRow" desc="Egységár és a választott méretre számolt összeg, bruttóban." wide>
        <Cell caption="szélkidolgozás (egy választható)">
          <fieldset className="uis-stack" style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="sd-caps" style={{ marginBottom: 'var(--space-3)' }}>
              Szélkidolgozás
            </legend>
            {EDGES.map((o) => (
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
        </Cell>
        <Cell caption="kiegészítők (több választható)">
          <div className="uis-stack">
            <OptionRow type="checkbox" label="Kontúrvágás" description="A grafika körvonala mentén vágjuk." rate={2540} rateUnit="m²" amount={635} checked={contour} onChange={(e) => setContour(e.target.checked)} />
            <OptionRow type="checkbox" label="UV-laminálás" description="Karcolás és fakulás ellen." rate={2540} rateUnit="m²" amount={635} />
            <OptionRow type="checkbox" label="Tiltott opció" disabled />
          </div>
        </Cell>
      </Spec>

      <Spec title="Anyagválasztó · MaterialPicker" desc="Anyagminta, név, bruttó m²-ár és adatlap. A csillagos érték tipikus gyártói adat." wide>
        <Cell caption="molinó">
          <MaterialPicker materials={MOLINO.materials.map(materialOption)} value={banner} onChange={setBanner} />
        </Cell>
        <Cell caption="tábla">
          <MaterialPicker legend="Lemez" materials={TABLA.materials.map(materialOption)} value={board} onChange={setBoard} />
        </Cell>
      </Spec>

      <Spec title="Fájlfeltöltő · FileDrop, FileList" wide>
        <Cell caption="üres">
          <FileDrop onFiles={() => {}} hint="PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB" />
        </Cell>
        <Cell caption="feltöltés">
          <FileDrop onFiles={() => {}} progress={42} />
        </Cell>
        <Cell caption="hiba">
          <FileDrop onFiles={() => {}} error="Ezt a fájltípust nem tudjuk feldolgozni. Küldjön PDF-et vagy képet." />
        </Cell>
        <Cell caption="feltöltött fájlok">
          <FileList items={files} onRemove={(id) => setFiles((list) => list.filter((f) => f.id !== id))} />
        </Cell>
      </Spec>
    </>
  );
}
