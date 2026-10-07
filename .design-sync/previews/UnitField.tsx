import { UnitField } from '@stiletdekor/ui';

export const LetterHeight = () => <UnitField label="Betűmagasság" unit="mm" defaultValue="350" help="A legmagasabb betű magassága." />;

export const WithError = () => <UnitField label="Szélesség" unit="cm" defaultValue="620" error="Legfeljebb 500 cm lehet." />;
