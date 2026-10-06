import type { HTMLAttributes, ReactNode } from 'react';
import { formatNumberHu } from '@/domain/money';
import { Badge, type BadgeTone } from '../Badge/Badge';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import './FileList.css';

export type FileStatus = 'pending' | 'ok' | 'warn' | 'error';

const STATUS_TONE: Readonly<Record<FileStatus, BadgeTone>> = { pending: 'neutral', ok: 'ok', warn: 'warn', error: 'bad' };
const STATUS_TEXT: Readonly<Record<FileStatus, string>> = {
  pending: 'Feldolgozás…',
  ok: 'Rendben',
  warn: 'Ellenőrizze',
  error: 'Hiba',
};

export interface FileListItem {
  id: string;
  name: string;
  /** Size in bytes, shown as "2,4 MB". */
  size?: number;
  /** Thumbnail URL (an image file's object URL); a file icon without it. */
  thumbnailUrl?: string;
  /** What we read from the file, e.g. "841×1189 mm · A0 · vektoros". */
  detail?: ReactNode;
  status?: FileStatus;
  /** Status text instead of the default ("Méret felismerve", "Nem olvasható"). */
  statusText?: string;
}

/** "2,4 MB", "830 kB" (decimal units, like most operating systems). */
export function formatFileSize(bytes: number): string {
  return bytes >= 1_000_000
    ? `${formatNumberHu(bytes / 1_000_000, 1)}\u00a0MB`
    : `${formatNumberHu(Math.max(1, bytes / 1000), 0)}\u00a0kB`;
}

export interface FileListProps extends HTMLAttributes<HTMLUListElement> {
  items: readonly FileListItem[];
  /** Shows a remove button per file. */
  onRemove?: (id: string) => void;
}

/** Uploaded files with thumbnail, name, size, what was recognized and a status; each removable. */
export function FileList({ items, onRemove, className, ...rest }: FileListProps) {
  return (
    <ul className={cx('sd-files', className)} {...rest}>
      {items.map((f) => {
        const meta = [f.size !== undefined ? formatFileSize(f.size) : null].filter(Boolean);
        return (
          <li className="sd-file" key={f.id}>
            <span className="sd-file__thumb" aria-hidden="true">
              {f.thumbnailUrl ? <img src={f.thumbnailUrl} alt="" /> : <Icon name="file" />}
            </span>
            <div className="sd-file__body">
              <span className="sd-file__name" title={f.name}>
                {f.name}
              </span>
              {(meta.length > 0 || f.detail) && (
                <span className="sd-file__meta">
                  {meta.join(' · ')}
                  {meta.length > 0 && f.detail ? ' · ' : ''}
                  {f.detail}
                </span>
              )}
              {f.status && (
                <Badge className="sd-file__status" tone={STATUS_TONE[f.status]} dot>
                  {f.statusText ?? STATUS_TEXT[f.status]}
                </Badge>
              )}
            </div>
            {onRemove && (
              <IconButton icon="trash" size="sm" variant="plain" label={`Fájl törlése: ${f.name}`} onClick={() => onRemove(f.id)} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
