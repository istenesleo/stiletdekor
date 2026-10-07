import { IconButton } from '@stiletdekor/ui';

export const CartWithCount = () => (
  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
    <IconButton icon="cart" label="Kosár megnyitása, 0 tétel" count={0} />
    <IconButton icon="cart" label="Kosár megnyitása, 3 tétel" count={3} />
    <IconButton icon="cart" label="Kosár megnyitása, 120 tétel" count={120} />
  </div>
);

export const Actions = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    <IconButton icon="menu" label="Menü" />
    <IconButton icon="close" label="Bezárás" variant="plain" />
    <IconButton icon="swap" label="Szélesség és magasság cseréje" size="sm" />
    <IconButton icon="trash" label="Tétel törlése" size="sm" variant="plain" />
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    <IconButton icon="pin" label="Csak a műhely közelében" pressed />
    <IconButton icon="trash" label="Tétel törlése" disabled />
  </div>
);
