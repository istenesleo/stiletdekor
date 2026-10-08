SectionHeader from @stiletdekor/ui. Use via `window.StiletUI.SectionHeader` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Eyebrow, title and lead at the top of a page section.
@category basics

## Props

```ts
interface SectionHeaderProps {
  /** Small uppercase line above the title, e.g. "Webshop · azonnali ár". */
  eyebrow?: string;
  title: React.ReactNode;
  /** One short sentence under the title. */
  lead?: React.ReactNode;
  /** Heading level of the title (2 by default: sections under the page's h1). */
  level?: 1 | 2 | 3;
  /** lg (default) for page sections, sm for blocks inside a section. */
  size?: "sm" | "lg";
  /** id for the title, to label the section with aria-labelledby. */
  titleId?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Large

```jsx
() => (
  <SectionHeader
    eyebrow="Webshop · azonnali ár"
    title="Rendelje meg online"
    lead="Méret, anyag, grafika: az árat és a határidőt azonnal látja."
  />
)
```

### Small

```jsx
() => <SectionHeader size="sm" level={3} eyebrow="Folyamat" title="Négy lépés, egy csapat" />
```
