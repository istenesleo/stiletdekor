import { TextField } from '@stiletdekor/ui';

export const Required = () => <TextField label="Név" autoComplete="name" required />;

export const WithHelp = () => (
  <TextField label="Telefon" type="tel" autoComplete="tel" help="Erre a számra hívjuk vissza." defaultValue="+36 30 123 4567" />
);

export const WithError = () => (
  <TextField label="E-mail" type="email" autoComplete="email" required defaultValue="maria@" error="Adjon meg érvényes e-mail-címet." />
);

export const Multiline = () => <TextField label="Megjegyzés" multiline placeholder="pl. mikor érhető el telefonon" />;

export const Disabled = () => <TextField label="Cégnév" disabled defaultValue="Minta Kft." />;
