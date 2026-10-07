import { type ReactNode, useEffect, useId, useRef } from 'react';
import '../base.css';
import { cx } from '../cx';
import { IconButton } from '../IconButton/IconButton';
import './Drawer.css';

export interface DrawerProps {
  open: boolean;
  /** Called on the close button, Escape and a click outside the panel. */
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Sticky bottom area: totals and the main action. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Side panel that opens from the right over the page, used for the cart.
 * A modal dialog: focus stays inside, Escape and a click on the dimmed page close it, and focus returns to
 * what opened it.
 * @category shop
 */
export function Drawer({ open, onClose, title, children, footer, className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `sd-drawer${useId().replace(/:/g, '')}`;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={cx('sd-drawer', className)}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sd-drawer__panel">
        <div className="sd-drawer__head">
          <h2 className="sd-drawer__title" id={titleId}>
            {title}
          </h2>
          <IconButton icon="close" label="Bezárás" variant="plain" onClick={onClose} />
        </div>
        <div className="sd-drawer__body">{children}</div>
        {footer && <div className="sd-drawer__foot">{footer}</div>}
      </div>
    </dialog>
  );
}
