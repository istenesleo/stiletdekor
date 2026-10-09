import { QuoteForm } from '@stiletdekor/ui';

const BETUK = {
  id: 'betuk',
  name: 'Világító és plasztik betűk, logók',
  description: 'Világító vagy plasztik betűk, logók homlokzatra, beltérbe.',
  locationRequired: true,
  fields: [
    { id: 'feliratSzoveg', label: 'A felirat szövege', type: 'text', required: false, maxLength: 200 },
    { id: 'logo', label: 'Logó', type: 'file', required: false, accept: ['.pdf', '.svg'], maxFiles: 10 },
    { id: 'betumagassagCm', label: 'Betűmagasság', type: 'number', required: true, unit: 'cm', min: 1, max: 500, integer: false },
    {
      id: 'anyag',
      label: 'Anyag',
      type: 'select',
      required: true,
      options: [
        { value: 'plexi', label: 'Plexi' },
        { value: 'alu', label: 'Alumínium' },
        { value: 'pvc', label: 'PVC' },
        { value: 'javaslat', label: 'Kérem a javaslatukat' },
      ],
    },
  ],
  requireOneOf: [{ fields: ['feliratSzoveg', 'logo'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' }],
} as const;

export const AllSteps = () => <QuoteForm type={BETUK} token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" today="2026-10-09" />;

export const WizardStep = () => <QuoteForm type={BETUK} token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" today="2026-10-09" step={0} answers={{}} />;
