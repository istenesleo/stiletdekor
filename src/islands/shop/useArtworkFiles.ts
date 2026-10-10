// The files of one cart item (or the site photos): each chosen file is uploaded at once, and, in the configurator,
// read in the browser for its size and resolution (the analyzer, with pdf-lib, loads on the first file only).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import type { CartFile } from '@/domain/cart';
import { MAX_UPLOADS_PER_ITEM } from '@/domain/config-schemas';
import { UPLOAD_FAILED_MESSAGE } from '@/domain/uploads';
import { UploadError, uploadFile } from './upload-client';

export interface ArtworkFileState {
  localId: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  uploadId?: string | undefined;
  uploadedAt?: string | undefined;
  error?: string | undefined;
  emailFallback?: boolean | undefined;
  analysis?: ArtworkAnalysis | undefined;
  /** An object URL of an image file, for the preview. */
  previewUrl?: string | undefined;
}

export interface ArtworkFiles {
  files: ArtworkFileState[];
  add(files: readonly File[]): void;
  retry(localId: string): void;
  remove(localId: string): void;
  clear(): void;
  /** A file is still uploading. */
  busy: boolean;
  /** No more files fit. */
  full: boolean;
  /** The uploaded files, as the cart keeps them. */
  uploaded: CartFile[];
}

export interface ArtworkFilesOptions {
  initial?: readonly CartFile[];
  /** Read each file's size and resolution in the browser (the configurator); off for the site photos. */
  analyze?: boolean;
  /** A file's analysis is ready; `first` tells whether it is the first file of the list. */
  onAnalysis?: (analysis: ArtworkAnalysis, first: boolean) => void;
  max?: number;
}

const PREVIEWABLE = /^image\/(png|jpeg|webp|gif|avif|svg\+xml)$/;

function readBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

async function analyzeFile(file: File): Promise<ArtworkAnalysis> {
  const [{ analyzeArtwork }, bytes] = await Promise.all([import('@/domain/artwork/analyze'), readBytes(file)]);
  return analyzeArtwork(bytes, file.name);
}

const fromCart = (file: CartFile): ArtworkFileState => ({
  localId: file.uploadId,
  name: file.name,
  size: file.size,
  status: 'done',
  progress: 100,
  uploadId: file.uploadId,
  uploadedAt: file.uploadedAt,
});

export function useArtworkFiles({ initial = [], analyze = false, onAnalysis, max = MAX_UPLOADS_PER_ITEM }: ArtworkFilesOptions = {}): ArtworkFiles {
  const [files, setFiles] = useState<ArtworkFileState[]>(() => initial.map(fromCart));
  const originals = useRef(new Map<string, File>());
  const latest = useRef({ files, onAnalysis });
  latest.current = { files, onAnalysis };

  const patch = useCallback((localId: string, change: Partial<ArtworkFileState>) => {
    setFiles((list) => list.map((file) => (file.localId === localId ? { ...file, ...change } : file)));
  }, []);

  const start = useCallback(
    (localId: string, file: File) => {
      patch(localId, { status: 'uploading', progress: 0, error: undefined, emailFallback: undefined });
      uploadFile(file, { onProgress: (progress) => patch(localId, { progress }) })
        .then((uploaded) => patch(localId, { status: 'done', progress: 100, uploadId: uploaded.id, uploadedAt: new Date().toISOString() }))
        .catch((error: unknown) =>
          patch(localId, {
            status: 'error',
            error: error instanceof UploadError ? error.message : UPLOAD_FAILED_MESSAGE,
            emailFallback: error instanceof UploadError && error.emailFallback,
          }),
        );
    },
    [patch],
  );

  const add = useCallback(
    (chosen: readonly File[]) => {
      const room = Math.max(0, max - latest.current.files.length);
      for (const file of chosen.slice(0, room)) {
        const localId = crypto.randomUUID();
        originals.current.set(localId, file);
        const previewUrl = PREVIEWABLE.test(file.type) && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
        setFiles((list) => [...list, { localId, name: file.name, size: file.size, status: 'uploading', progress: 0, previewUrl }]);
        start(localId, file);
        if (analyze) {
          analyzeFile(file)
            .then((analysis) => {
              patch(localId, { analysis });
              latest.current.onAnalysis?.(analysis, latest.current.files[0]?.localId === localId);
            })
            .catch(() => {
              // The size can still be typed; the upload goes on.
            });
        }
      }
    },
    [analyze, max, patch, start],
  );

  const forget = (file: ArtworkFileState) => {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    originals.current.delete(file.localId);
  };

  useEffect(() => () => latest.current.files.forEach((file) => file.previewUrl && URL.revokeObjectURL(file.previewUrl)), []);

  return {
    files,
    add,
    retry: (localId) => {
      const file = originals.current.get(localId);
      if (file) start(localId, file);
    },
    remove: (localId) =>
      setFiles((list) => {
        const gone = list.find((file) => file.localId === localId);
        if (gone) forget(gone);
        return list.filter((file) => file.localId !== localId);
      }),
    clear: () =>
      setFiles((list) => {
        list.forEach(forget);
        return [];
      }),
    busy: files.some((file) => file.status === 'uploading'),
    full: files.length >= max,
    uploaded: files
      .filter((file) => file.status === 'done' && file.uploadId)
      .map((file) => ({ uploadId: file.uploadId!, name: file.name, size: file.size, uploadedAt: file.uploadedAt ?? new Date().toISOString() })),
  };
}
