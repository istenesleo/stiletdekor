/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { UploadError, uploadFile } from './upload-client';
import { useArtworkFiles } from './useArtworkFiles';

// vi.mock is hoisted above the imports, so its data must be hoisted too.
const { ANALYSIS } = vi.hoisted(() => ({
  ANALYSIS: {
    format: 'pdf',
    pages: [],
    pixels: null,
    dpi: null,
    confidence: 'none',
    hints: { scale: null, bleedMmFromText: null, title: null },
    warnings: [],
  } as ArtworkAnalysis,
}));

vi.mock('./upload-client', async (importOriginal) => ({ ...(await importOriginal<typeof import('./upload-client')>()), uploadFile: vi.fn() }));
vi.mock('@/domain/artwork/analyze', () => ({ analyzeArtwork: vi.fn(async () => ANALYSIS) }));

const upload = vi.mocked(uploadFile);

// A block body: Vitest runs a function returned from beforeEach as its cleanup, and mockReset returns the mock.
beforeEach(() => {
  upload.mockReset();
});

describe('useArtworkFiles', () => {
  it('reads and uploads a chosen file, then lists it for the cart', async () => {
    upload.mockImplementation(async (file, options) => {
      options?.onProgress?.(50);
      return { id: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: file.name, size: file.size, format: 'pdf' };
    });
    const onAnalysis = vi.fn();
    const { result } = renderHook(() => useArtworkFiles({ analyze: true, onAnalysis }));
    act(() => result.current.add([new File(['%PDF-1.7'], 'logo.pdf')]));
    expect(result.current.busy).toBe(true);
    await waitFor(() => expect(result.current.files[0]?.status).toBe('done'));
    expect(result.current.busy).toBe(false);
    expect(result.current.uploaded).toEqual([
      { uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 8, uploadedAt: expect.any(String) },
    ]);
    await waitFor(() => expect(onAnalysis).toHaveBeenCalledWith(ANALYSIS, true));
  });

  it('keeps a refused file with its message, and tries again', async () => {
    upload.mockRejectedValueOnce(new UploadError('A fájlfeltöltés most nem működik.', true));
    const { result } = renderHook(() => useArtworkFiles());
    act(() => result.current.add([new File(['x'], 'logo.pdf')]));
    await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'error', error: 'A fájlfeltöltés most nem működik.', emailFallback: true }));
    upload.mockResolvedValueOnce({ id: 'u2', name: 'logo.pdf', size: 1, format: 'pdf' });
    act(() => result.current.retry(result.current.files[0]!.localId));
    await waitFor(() => expect(result.current.files[0]?.status).toBe('done'));
  });

  it('starts from the files of a cart item, and takes at most the limit', () => {
    const initial = [{ uploadId: 'u1', name: 'regi.pdf', size: 3, uploadedAt: '2026-10-09T10:00:00.000Z' }];
    const { result } = renderHook(() => useArtworkFiles({ initial, max: 2 }));
    expect(result.current.uploaded).toEqual(initial);
    upload.mockImplementation(() => new Promise(() => {}));
    act(() => result.current.add([new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]));
    expect(result.current.files).toHaveLength(2);
    expect(result.current.full).toBe(true);
  });
});
