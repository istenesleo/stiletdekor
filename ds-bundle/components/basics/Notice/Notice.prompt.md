Notice from @stiletdekor/ui. Use via `window.StiletUI.Notice` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

A message bar for info, warning, error or success. Keep it to one or two sentences.
E.g. "A végleges ár eltérhet a kalkulált ártól." (info), a failed upload (error), a sent order (success).
@category basics

## Props

```ts
interface NoticeProps {
  /** info (default), success, warning or error: sets the colored edge and the icon. */
  tone?: "error" | "info" | "success" | "warning";
  /** Optional bold first line. */
  title?: React.ReactNode;
  /** For messages that appear after an action: "polite" announces them to screen readers (role="status"), "assertive" interru */
  live?: "polite" | "assertive";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Info

```jsx
() => <Notice>A végleges ár eltérhet a kalkulált ártól.</Notice>
```

### Success

```jsx
() => (
  <Notice tone="success" title="Kosárba tettük">
    Molinó, 200×100 cm, 1 db.
  </Notice>
)
```

### Warning

```jsx
() => (
  <Notice tone="warning" title="A kép aránya eltér">
    Válasszon: kitöltés (vágással) vagy illesztés (kerettel).
  </Notice>
)
```

### ErrorNotice

```jsx
() => (
  <Notice tone="error">A fájlt nem sikerült megnyitni. Próbálja PDF, PNG vagy JPG formátumban.</Notice>
)
```
