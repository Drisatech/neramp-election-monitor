import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

export type SupportedUploadMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export type UploadValidation =
  | { valid: true; mimeType: SupportedUploadMime; sha256: string; sizeBytes: number }
  | { valid: false; error: string };

const extensionMime: Record<string, SupportedUploadMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function detectSupportedMime(buffer: Buffer): SupportedUploadMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

/** Validate file signature, declared MIME, extension, path-like filename and size before storage/OCR. */
export function validateUploadBuffer(
  filename: string,
  buffer: Buffer,
  declaredMime?: string,
  maxBytes = 25 * 1024 * 1024,
): UploadValidation {
  const name = String(filename || '').trim();
  if (!name || name.includes('/') || name.includes('\\') || name.split(/[\\/]/).includes('..')) {
    return { valid: false, error: 'Filename is missing or contains path traversal characters.' };
  }
  if (!buffer || buffer.length === 0) return { valid: false, error: 'Uploaded file is empty.' };
  if (buffer.length > maxBytes) return { valid: false, error: `File exceeds the ${maxBytes}-byte size limit.` };

  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const expectedMime = extensionMime[extension];
  if (!expectedMime) return { valid: false, error: 'File extension is not permitted.' };

  const detectedMime = detectSupportedMime(buffer);
  if (!detectedMime) return { valid: false, error: 'File signature is not a supported PDF or image type.' };
  if (detectedMime !== expectedMime) return { valid: false, error: 'File extension does not match the binary file signature.' };
  if (declaredMime && declaredMime !== detectedMime) {
    return { valid: false, error: 'Declared MIME type does not match the binary file signature.' };
  }

  return {
    valid: true,
    mimeType: detectedMime,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    sizeBytes: buffer.length,
  };
}
