OrderSubmit from @stiletdekor/ui. Use via `window.StiletUI.OrderSubmit` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

The end of the checkout: accept the terms, see what happens next, and send the order for checking.
No payment obligation yet: the final price comes with the pro forma invoice.
@category shop

## Props

```ts
interface OrderSubmitProps {
  /** Whether the terms are accepted (controlled). */
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Label of the terms checkbox; may contain links to the ÁSZF and the privacy notice. */
  acceptLabel?: React.ReactNode;
  /** Error under the checkbox, e.g. when submitting without accepting. */
  error?: React.ReactNode;
  /** The small print above the button; by default what sending the order means and that the price may change. */
  terms?: React.ReactNode;
  /** Button text, "Rendelés elküldése ellenőrzésre" by default. */
  label?: string;
  loading?: boolean;
  onSubmit: () => void;
  className?: string;
}
```

## Examples

### Default

```jsx
() => {
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  return (
    <OrderSubmit
      accepted={accepted}
      onAcceptedChange={setAccepted}
      error={tried && !accepted ? 'Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.' : undefined}
      loading={sending}
      onSubmit={() => {
        setTried(true);
        if (accepted) setSending(true);
      }}
    />
  );
}
```

### NotAccepted

```jsx
() => (
  <OrderSubmit accepted={false} onAcceptedChange={() => {}} error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés." onSubmit={() => {}} />
)
```

### Sending

```jsx
() => <OrderSubmit accepted onAcceptedChange={() => {}} loading onSubmit={() => {}} />
```
