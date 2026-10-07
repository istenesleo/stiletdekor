import { Checkbox } from '@stiletdekor/ui';

export const WithDescription = () => (
  <Checkbox
    label="Helyszíni felmérést kérek"
    description="Kimegyünk, lemérjük a felületet, és utána küldjük a pontos ajánlatot."
    defaultChecked
  />
);

export const RequiredWithError = () => (
  <Checkbox label="Elfogadom az ÁSZF-et" required error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés." />
);

export const Disabled = () => <Checkbox label="Hírlevelet kérek" disabled />;
