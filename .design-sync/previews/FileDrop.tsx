import { FileDrop } from '@stiletdekor/ui';

export const Empty = () => <FileDrop onFiles={() => {}} hint="PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB" />;

export const Uploading = () => <FileDrop onFiles={() => {}} progress={42} />;

export const WithError = () => (
  <FileDrop onFiles={() => {}} error="Ezt a fájltípust nem tudjuk feldolgozni. Küldjön PDF-et vagy képet." />
);

export const Disabled = () => <FileDrop onFiles={() => {}} disabled hint="A feltöltés a méret megadása után nyílik meg." />;
