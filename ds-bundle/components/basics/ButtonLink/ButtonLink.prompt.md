ButtonLink from @stiletdekor/ui. Use via `window.StiletUI.ButtonLink` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

A link that looks like a Button, for navigation.
E.g. "Webshop megnyitása", "Ajánlatot kérek".
@category basics

## Props

```ts
interface ButtonLinkProps {
  href: string;
  /** primary: brand color, the one main action of a view; secondary and ghost: other actions; link: text-like. */
  variant?: "primary" | "secondary" | "ghost" | "link";
  /** md: 44 px tall (default); sm: 36 px. */
  size?: "sm" | "md";
  /** Icon before or after the label. */
  icon?: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  iconPosition?: "start" | "end";
  /** Stretch to the full width of the container. */
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### Primary

```jsx
() => <ButtonLink href="#ajanlat">Ajánlatot kérek</ButtonLink>
```

### Variants

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
    <ButtonLink href="#webshop" variant="secondary" icon="arrow-right" iconPosition="end">
      Webshop megnyitása
    </ButtonLink>
    <ButtonLink href="#referenciak" variant="ghost">
      Referenciák
    </ButtonLink>
    <ButtonLink href="tel:+36705385030" variant="link" icon="phone">
      +36 70 538 5030
    </ButtonLink>
  </div>
)
```
