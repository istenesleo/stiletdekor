import { useState } from 'react';
import { Button, CartLine, Drawer, OrderSubmit, PriceBreakdown } from '@stiletdekor/ui';

export const Cart = () => {
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
};
