// Pictograms of the custom job types (quote wizard), on a 48×36 grid like the product pictograms.
export const JOB_PICTOGRAMS = {
  autofoliazas:
    '<path d="M4 26V12h24l9 6h7v8z"/><circle cx="13" cy="27" r="3.5"/><circle cx="35" cy="27" r="3.5"/><path d="M28 12v6h9M9 17h12"/>',
  kirakat: '<rect x="6" y="5" width="36" height="26"/><path d="M24 5v26M6 22h36M11 12l5-5M29 27l8-8"/>',
  ceger: '<rect x="5" y="9" width="38" height="13"/><path d="M10 22v8M38 22v8M10 15h28"/>',
  betuk: '<path d="M7 29 15 7l8 22M10 22h10M28 7v22h9a6 6 0 0 0 0-12h-9M28 17h8a5 5 0 0 0 0-10h-8"/>',
  'led-fal':
    '<rect x="6" y="5" width="36" height="24"/><path d="M15 5v24M24 5v24M33 5v24M6 13h36M6 21h36M18 33h12M24 29v4"/>',
  rendezveny: '<path d="M5 31V9h38v22"/><path d="M5 31h38M14 9v22M34 9v22M20 16h8M20 20h8"/><path d="M9 4l2 3M39 4l-2 3"/>',
  kinalopult: '<path d="M4 12h40M7 12v20h34V12M7 18h34"/><path d="M14 23h20"/>',
  '3d-nyomtatas': '<path d="M24 4 41 13v16l-17 9-17-9V13z"/><path d="M7 13l17 9 17-9M24 22v16"/>',
  egyeb: '<circle cx="12" cy="18" r="3"/><circle cx="24" cy="18" r="3"/><circle cx="36" cy="18" r="3"/>',
} as const;

export type JobPictogram = keyof typeof JOB_PICTOGRAMS;
