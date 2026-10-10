// The product-specific part of the configurator: material, size, edge finish, add-ons and formats, all from the
// catalog and priced gross. One switch instead of six components: they would repeat the same few controls.
import { MATRICA, MOLINO, ORIENTATIONS, type Orientation, PLAKAT, ROLLUP, TABLA, VASZONKEP } from '@/domain/catalog';
import { formatHuf } from '@/domain/money';
import { grossOf } from '@/domain/pricing';
import { materialOption } from '@/site/catalog-ui';
import { ChipGroup } from '@/ui/ChipGroup/ChipGroup';
import { MaterialPicker } from '@/ui/MaterialPicker/MaterialPicker';
import { OptionRow } from '@/ui/OptionRow/OptionRow';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { SegmentedChoice } from '@/ui/SegmentedChoice/SegmentedChoice';
import { SizeFields } from '@/ui/SizeFields/SizeFields';
import { type Draft, sizeText } from './draft';

export interface ProductOptionsProps {
  draft: Draft;
  /** Messages by configuration path (draftIssues). */
  issues: Readonly<Record<string, string>>;
  onChange: (change: Partial<Draft>) => void;
  /** The size was read from the uploaded file. */
  sizeFromFile: boolean;
  /** The customer typed or picked a size: it no longer comes from the file. */
  onSizeTyped: () => void;
}

const gross = (net: number) => formatHuf(grossOf(net));

function Size({
  draft,
  issues,
  onChange,
  sizeFromFile,
  onSizeTyped,
  presets,
}: ProductOptionsProps & { presets?: readonly { readonly widthCm: number; readonly heightCm: number }[] }) {
  const key = (widthCm: number, heightCm: number) => `${sizeText(widthCm)}×${sizeText(heightCm)}`;
  return (
    <>
      {presets && (
        <ChipGroup
          legend="Gyakori méretek"
          options={presets.map((p) => ({ value: key(p.widthCm, p.heightCm), label: `${key(p.widthCm, p.heightCm)} cm` }))}
          value={`${draft.width}×${draft.height}`}
          onChange={(value) => {
            const [width = '', height = ''] = value.split('×');
            onSizeTyped();
            onChange({ width, height });
          }}
        />
      )}
      <SizeFields
        width={draft.width}
        height={draft.height}
        onWidthChange={(width) => {
          onSizeTyped();
          onChange({ width });
        }}
        onHeightChange={(height) => {
          onSizeTyped();
          onChange({ height });
        }}
        onSwap={() => onChange({ width: draft.height, height: draft.width })}
        fromFile={sizeFromFile}
        error={issues.widthCm ?? issues.heightCm}
      />
    </>
  );
}

function Orientations({ draft, onChange }: ProductOptionsProps) {
  return (
    <SegmentedChoice
      legend="Tájolás"
      options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.name }))}
      value={draft.orientation}
      onChange={(orientation) => onChange({ orientation: orientation as Orientation })}
    />
  );
}

export function ProductOptions(props: ProductOptionsProps) {
  const { draft, issues, onChange } = props;
  switch (draft.productId) {
    case 'molino':
      return (
        <>
          <MaterialPicker materials={MOLINO.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} presets={MOLINO.suggestedSizes} />
          <fieldset className="shop-cfg__group">
            <legend>Szélkidolgozás</legend>
            {MOLINO.edgeFinishes.map((edge) => (
              <OptionRow
                key={edge.id}
                name="edgeFinishId"
                value={edge.id}
                label={edge.name}
                description={edge.description}
                rate={grossOf(edge.priceNetPerM)}
                rateUnit="fm"
                checked={draft.edgeFinishId === edge.id}
                onChange={() => onChange({ edgeFinishId: edge.id })}
              />
            ))}
          </fieldset>
        </>
      );
    case 'matrica':
      return (
        <>
          <MaterialPicker materials={MATRICA.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} />
          <fieldset className="shop-cfg__group">
            <legend>Kiegészítők</legend>
            {MATRICA.areaAddOns.map((addOn) => (
              <OptionRow
                key={addOn.id}
                type="checkbox"
                name="addOnIds"
                value={addOn.id}
                label={addOn.name}
                description={addOn.description}
                rate={grossOf(addOn.priceNetPerM2)}
                rateUnit="m²"
                checked={draft.addOnIds.includes(addOn.id)}
                onChange={(event) =>
                  onChange({
                    addOnIds: event.target.checked ? [...draft.addOnIds, addOn.id] : draft.addOnIds.filter((id) => id !== addOn.id),
                  })
                }
              />
            ))}
          </fieldset>
        </>
      );
    case 'tabla':
      return (
        <>
          <MaterialPicker materials={TABLA.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} />
          {TABLA.pieceAddOns.map((addOn) => (
            <QuantityStepper
              key={addOn.id}
              label={`${addOn.name} (${gross(addOn.priceNet)}/${addOn.unit})`}
              help={addOn.description}
              min={0}
              max={addOn.maxCount}
              value={addOn.id === 'furat' ? draft.furat : draft.tavtarto}
              onChange={(count) => onChange(addOn.id === 'furat' ? { furat: count } : { tavtarto: count })}
              error={issues[`addOnCounts.${addOn.id}`]}
            />
          ))}
        </>
      );
    case 'rollup':
      return (
        <>
          <SegmentedChoice
            legend="Kivitel"
            options={[
              { value: 'teljes', label: 'Teljes roll-up', description: 'Állvány, nyomott grafika és táska' },
              { value: 'grafika', label: ROLLUP.graphicOnly.name, description: `${ROLLUP.graphicOnly.description} ${gross(ROLLUP.graphicOnly.priceNet)}` },
            ]}
            value={draft.graphicOnly ? 'grafika' : 'teljes'}
            onChange={(value) => onChange({ graphicOnly: value === 'grafika' })}
          />
          <SegmentedChoice
            legend="Méret"
            options={ROLLUP.formats.map((f) => ({ value: f.id, label: f.name, description: draft.graphicOnly ? undefined : gross(f.priceNet) }))}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
        </>
      );
    case 'plakat':
      return (
        <>
          <SegmentedChoice
            legend="Méret"
            options={[
              ...PLAKAT.formats.map((f) => ({ value: f.id, label: f.name, description: gross(f.priceNet) })),
              { value: PLAKAT.blueback.id, label: PLAKAT.blueback.name, description: `${gross(PLAKAT.blueback.priceNetPerM2)}/m²` },
            ]}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
          {draft.formatId === PLAKAT.blueback.id ? (
            <Size {...props} />
          ) : (
            <>
              <SegmentedChoice
                legend="Papír"
                options={PLAKAT.paperFinishes.map((p) => ({ value: p.id, label: p.name }))}
                value={draft.paperFinish}
                onChange={(paperFinish) => onChange({ paperFinish })}
              />
              <Orientations {...props} />
            </>
          )}
        </>
      );
    case 'vaszonkep':
      return (
        <>
          <SegmentedChoice
            legend="Méret"
            options={[
              ...VASZONKEP.formats.map((f) => ({ value: f.id, label: f.name, description: gross(f.priceNet) })),
              { value: 'egyedi', label: VASZONKEP.custom.name, description: `${gross(VASZONKEP.custom.priceNetPerM2)}/m²` },
            ]}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
          {draft.formatId === 'egyedi' ? <Size {...props} /> : <Orientations {...props} />}
        </>
      );
  }
}
