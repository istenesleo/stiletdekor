FileDrop from @stiletdekor/ui. Use via `window.StiletUI.FileDrop` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Drop zone for artwork and photos: drag files onto it or pick them with the button.
States: empty, dragging, uploading (progress), error, disabled.
@category forms

## Props

```ts
interface FileDropProps {
  /** Called with the chosen or dropped files. Check type and size yourself. */
  onFiles: (files: File[]) => void;
  /** File input `accept`, e.g. ".pdf,.ai,.eps,.svg,.tif,.tiff,.psd,.jpg,.jpeg,.png". */
  accept?: string;
  multiple?: boolean;
  /** Main line, "Húzza ide a grafikát" by default. */
  title?: React.ReactNode;
  /** Formats and limits, e.g. "PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB". */
  hint?: React.ReactNode;
  /** Button text, "Fájl kiválasztása" by default. */
  buttonLabel?: string;
  /** Upload progress 0–100: shows a progress bar instead of the button. */
  progress?: number;
  /** Error message, e.g. "Ezt a fájltípust nem tudjuk feldolgozni.". */
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}
```

## Examples

### Empty

```jsx
() => <FileDrop onFiles={() => {}} hint="PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB" />
```

### Uploading

```jsx
() => <FileDrop onFiles={() => {}} progress={42} />
```

### WithError

```jsx
() => (
  <FileDrop onFiles={() => {}} error="Ezt a fájltípust nem tudjuk feldolgozni. Küldjön PDF-et vagy képet." />
)
```

### Disabled

```jsx
() => <FileDrop onFiles={() => {}} disabled hint="A feltöltés a méret megadása után nyílik meg." />
```
