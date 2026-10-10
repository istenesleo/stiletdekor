// The file field of the configurator and of the site photos: choose or drop files; each is uploaded at once, with its
// progress as text. A refused upload offers e-mail instead, and the item can still go into the cart without it.
import { ARTWORK_ACCEPT } from '@/domain/artwork/filetypes';
import { UPLOAD_ACCEPTED_TEXT } from '@/domain/uploads';
import { Button } from '@/ui/Button/Button';
import { FileDrop } from '@/ui/FileDrop/FileDrop';
import { FileList, type FileListItem } from '@/ui/FileList/FileList';
import { Notice } from '@/ui/Notice/Notice';
import { artworkDetail } from './artwork-size';
import type { ArtworkFiles } from './useArtworkFiles';

export interface ArtworkFieldProps {
  files: ArtworkFiles;
  title?: string;
  hint?: string;
}

export function ArtworkField({ files, title = 'Húzza ide a grafikát', hint = UPLOAD_ACCEPTED_TEXT }: ArtworkFieldProps) {
  const items: FileListItem[] = files.files.map((file) => ({
    id: file.localId,
    name: file.name,
    size: file.size,
    thumbnailUrl: file.previewUrl,
    detail: file.status === 'error' ? file.error : file.analysis ? artworkDetail(file.analysis) : undefined,
    status: file.status === 'uploading' ? 'pending' : file.status === 'done' ? 'ok' : 'error',
    statusText: file.status === 'uploading' ? `Feltöltés: ${file.progress}%` : file.status === 'done' ? 'Feltöltve' : 'Nem sikerült',
  }));
  const failed = files.files.filter((file) => file.status === 'error');
  return (
    <div className="shop-cfg__files">
      <FileDrop onFiles={files.add} accept={ARTWORK_ACCEPT} multiple title={title} hint={hint} disabled={files.full} />
      {items.length > 0 && <FileList items={items} onRemove={files.remove} />}
      {failed.map((file) => (
        <Button key={file.localId} variant="secondary" size="sm" onClick={() => files.retry(file.localId)}>
          Újra: {file.name}
        </Button>
      ))}
      {failed.some((file) => file.emailFallback) && (
        <Notice>A fájlt a rendelés után e-mailben is elküldheti, a rendelésszámmal. A tétel fájl nélkül is kosárba tehető.</Notice>
      )}
    </div>
  );
}
