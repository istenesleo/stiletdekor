import type { ReactNode } from 'react';

/** One component on the specimen page: a title, an optional note and a grid of cells. */
export function Spec({ id, title, desc, wide, children }: { id?: string; title: string; desc?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className="uis-spec" id={id} aria-label={title}>
      <h2>{title}</h2>
      {desc && <p className="uis-desc">{desc}</p>}
      <div className={wide ? 'uis-grid uis-grid--wide' : 'uis-grid'}>{children}</div>
    </section>
  );
}

/** One state or variant, captioned. */
export function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="uis-cell">
      <p className="sd-caps uis-cap">{caption}</p>
      {children}
    </div>
  );
}

/** A group heading between specs ("Alapelemek", "Űrlap", …). */
export function Group({ id, title }: { id: string; title: string }) {
  return (
    <h2 className="uis-group" id={id}>
      {title}
    </h2>
  );
}
