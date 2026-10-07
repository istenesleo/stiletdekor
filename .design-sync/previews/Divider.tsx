import { Divider } from '@stiletdekor/ui';

export const Plain = () => (
  <div>
    <p style={{ margin: 0 }}>Molinó, 200×100 cm</p>
    <Divider />
    <p style={{ margin: 0 }}>Roll-up, 85×200 cm</p>
  </div>
);

export const WithLabel = () => (
  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
    <Divider label="Átvétel" />
    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Személyes átvétel a műhelyben, Budapest.</p>
  </div>
);
