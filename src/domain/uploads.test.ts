import { describe, expect, it } from 'vitest';
import { cleanFileName, contentTypeOf, formatFitsExtension, isUploadExpired, MAX_UPLOAD_BYTES } from './uploads';

describe('upload rules', () => {
  it('allows 95 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(95 * 1024 * 1024);
  });

  it('accepts the same format or a sibling behind an extension', () => {
    expect(formatFitsExtension('pdf', 'pdf')).toBe(true);
    expect(formatFitsExtension('ai', 'pdf')).toBe(true);
    expect(formatFitsExtension('eps', 'ai')).toBe(true);
    expect(formatFitsExtension('jpeg', 'png')).toBe(true);
    expect(formatFitsExtension('svg', 'pdf')).toBe(false);
    expect(formatFitsExtension('pdf', 'png')).toBe(false);
    expect(formatFitsExtension('pdf', 'unknown')).toBe(false);
  });

  it('names the content type of a format', () => {
    expect(contentTypeOf('pdf')).toBe('application/pdf');
    expect(contentTypeOf('svg')).toBe('image/svg+xml');
    expect(contentTypeOf('cdr')).toBe('application/octet-stream');
  });

  it('cleans the file name a header carried', () => {
    expect(cleanFileName(encodeURIComponent('Molinó végleges.pdf'))).toBe('Molinó végleges.pdf');
    expect(cleanFileName(encodeURIComponent('C:\\Users\\x\\logo.ai'))).toBe('logo.ai');
    expect(cleanFileName(encodeURIComponent('a\u0000b.png'))).toBe('ab.png');
    expect(cleanFileName('%E0%A4%A')).toBeNull();
    expect(cleanFileName(null)).toBeNull();
    expect(cleanFileName('  ')).toBeNull();
    const long = cleanFileName(encodeURIComponent(`${'x'.repeat(300)}.pdf`));
    expect(long).toHaveLength(200);
    expect(long?.endsWith('.pdf')).toBe(true);
  });

  it('expires a file after three days', () => {
    const now = new Date('2026-10-12T12:00:00Z');
    expect(isUploadExpired('2026-10-09T12:00:01Z', now)).toBe(false);
    expect(isUploadExpired('2026-10-09T11:59:59Z', now)).toBe(true);
  });
});
