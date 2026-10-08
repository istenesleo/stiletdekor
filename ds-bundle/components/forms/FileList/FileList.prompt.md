FileList from @stiletdekor/ui. Use via `window.StiletUI.FileList` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Uploaded files with thumbnail, name, size, what was recognized and a status, each removable.
@category forms

## Props

```ts
interface FileListProps {
  items: readonly FileListItem[];
  /** Shows a remove button per file. */
  onRemove?: (id: string) => void;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}
```

## Examples

### UploadedFiles

```jsx
() => {
  const [files, setFiles] = useState([
    { id: 'a', name: 'molino-ujranyitas-200x100.pdf', size: 2_400_000, detail: '2000×1000 mm · vektoros', status: 'ok' as const, statusText: 'Méret felismerve' },
    { id: 'b', name: 'kirakat-elolrol.jpg', size: 830_000, detail: '4032×3024 px · 72 dpi', status: 'warn' as const, statusText: 'Ellenőrizze a felbontást' },
    { id: 'c', name: 'regi-logo.cdr', size: 12_600_000, status: 'error' as const, statusText: 'Ebből nem olvasunk méretet' },
    { id: 'd', name: 'plakat-a2.tif', size: 48_000_000, status: 'pending' as const },
  ]);
  return <FileList items={files} onRemove={(id) => setFiles((list) => list.filter((f) => f.id !== id))} />;
}
```
