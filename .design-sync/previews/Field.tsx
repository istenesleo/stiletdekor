import { describedBy, Field, useFieldIds } from '@stiletdekor/ui';

export const WrappingASelect = () => {
  const ids = useFieldIds();
  const help = 'A futár díját a visszaigazolásban adjuk meg.';
  return (
    <Field label="Átvételi mód" htmlFor={ids.id} help={help} ids={ids}>
      <select id={ids.id} className="sd-input" aria-describedby={describedBy(ids, help)} defaultValue="futar">
        <option value="szemelyes">Személyes átvétel a műhelyben</option>
        <option value="futar">Futár</option>
        <option value="telepites">Telepítéssel</option>
      </select>
    </Field>
  );
};

export const WithError = () => {
  const ids = useFieldIds();
  const error = 'A rendelésszám így néz ki: R-2026-0087.';
  return (
    <Field label="Rendelésszám" htmlFor={ids.id} error={error} required ids={ids}>
      <input id={ids.id} className="sd-input" defaultValue="2026-87" required aria-invalid aria-describedby={describedBy(ids, undefined, error)} />
    </Field>
  );
};
