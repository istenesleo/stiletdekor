Drawer from @stiletdekor/ui. Use via `window.StiletUI.Drawer` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Side panel that opens from the right over the page, used for the cart.
A modal dialog: focus stays inside, Escape and a click on the dimmed page close it, and focus returns to
what opened it.
@category shop

## Props

```ts
interface DrawerProps {
  open: boolean;
  /** Called on the close button, Escape and a click outside the panel. */
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Sticky bottom area: totals and the main action. */
  footer?: React.ReactNode;
  className?: string;
}
```

## Examples

### Cart

```jsx
() => {
  const [open, setOpen] = useState(true);
  const [accepted, setAccepted] = useState(false);
  return (
    <>
      <Button icon="cart" onClick={() => setOpen(true)}>
        Kosár megnyitása
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Kosár"
        footer={
          <>
            <PriceBreakdown
              caption="Kosár összesítő"
              rows={[
                { label: 'Termékek', amount: 68117 },
                { label: 'Átvétel', amount: 0 },
              ]}
              totalLabel="Kalkulált végösszeg, bruttó"
              total={68117}
            />
            <OrderSubmit accepted={accepted} onAcceptedChange={setAccepted} onSubmit={() => {}} />
          </>
        }
      >
        <CartLine title="Molinó · Standard frontlit" spec="200×100 cm · szegés + ringli · 3 db" price={36494} product="molino" onRemove={() => {}} />
        <CartLine title="Roll-up · teljes" spec="85×200 cm · táskával · 1 db" price={31623} product="rollup" onRemove={() => {}} />
      </Drawer>
    </>
  );
}
```
