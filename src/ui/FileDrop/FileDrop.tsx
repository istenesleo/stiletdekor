import { type DragEvent, type ReactNode, useRef, useState } from 'react';
import '../base.css';
import '../Button/Button.css';
import { cx } from '../cx';
import { useFieldIds } from '../Field/Field';
import '../Field/Field.css';
import { Icon } from '../Icon/Icon';
import './FileDrop.css';

export interface FileDropProps {
  /** Called with the chosen or dropped files. Check type and size yourself. */
  onFiles: (files: File[]) => void;
  /** File input `accept`, e.g. ".pdf,.ai,.eps,.svg,.tif,.tiff,.psd,.jpg,.jpeg,.png". */
  accept?: string;
  multiple?: boolean;
  /** Main line, "Húzza ide a grafikát" by default. */
  title?: ReactNode;
  /** Formats and limits, e.g. "PDF, AI, EPS, SVG, TIFF, PSD, JPG, PNG · legfeljebb 200 MB". */
  hint?: ReactNode;
  /** Button text, "Fájl kiválasztása" by default. */
  buttonLabel?: string;
  /** Upload progress 0–100: shows a progress bar instead of the button. */
  progress?: number;
  /** Error message, e.g. "Ezt a fájltípust nem tudjuk feldolgozni.". */
  error?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Drop zone for artwork and photos: drag files onto it or pick them with the button. States: empty,
 * dragging, uploading (progress), error, disabled.
 */
export function FileDrop({
  onFiles,
  accept,
  multiple = false,
  title = 'Húzza ide a grafikát',
  hint,
  buttonLabel = 'Fájl kiválasztása',
  progress,
  error,
  disabled = false,
  id,
  className,
}: FileDropProps) {
  const ids = useFieldIds(id);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const uploading = progress !== undefined;
  const state = disabled ? 'disabled' : dragging ? 'dragging' : uploading ? 'uploading' : error ? 'error' : 'idle';

  const accepts = !disabled && !uploading;
  const onDragEnter = (e: DragEvent) => {
    if (!accepts) return;
    e.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!accepts) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      className={cx('sd-drop', className)}
      data-state={state}
      onDragEnter={onDragEnter}
      onDragOver={(e) => accepts && e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Icon name="upload" className="sd-drop__icon" />
      <p className="sd-drop__title">{dragging ? 'Engedje el a fájlt' : title}</p>
      {uploading ? (
        <div className="sd-drop__progress" role="status">
          <span>Feltöltés… {Math.round(progress)}%</span>
          <div className="sd-drop__bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        </div>
      ) : (
        <>
          <input
            type="file"
            id={ids.id}
            className="sd-vh"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            aria-describedby={[hint ? ids.helpId : '', error ? ids.errorId : ''].filter(Boolean).join(' ') || undefined}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (files.length) onFiles(files);
            }}
          />
          <label htmlFor={ids.id} className="sd-btn sd-btn--secondary sd-drop__btn">
            <Icon name="file" />
            <span>{buttonLabel}</span>
          </label>
        </>
      )}
      {hint && (
        <p className="sd-drop__hint" id={ids.helpId}>
          {hint}
        </p>
      )}
      {error && !uploading && (
        <p className="sd-field__error" id={ids.errorId} role="alert">
          <Icon name="error" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
