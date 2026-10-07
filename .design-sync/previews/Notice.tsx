import { Notice } from '@stiletdekor/ui';

export const Info = () => <Notice>A végleges ár eltérhet a kalkulált ártól.</Notice>;

export const Success = () => (
  <Notice tone="success" title="Kosárba tettük">
    Molinó, 200×100 cm, 1 db.
  </Notice>
);

export const Warning = () => (
  <Notice tone="warning" title="A kép aránya eltér">
    Válasszon: kitöltés (vágással) vagy illesztés (kerettel).
  </Notice>
);

export const ErrorNotice = () => (
  <Notice tone="error">A fájlt nem sikerült megnyitni. Próbálja PDF, PNG vagy JPG formátumban.</Notice>
);
