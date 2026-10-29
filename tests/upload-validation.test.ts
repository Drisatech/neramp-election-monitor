import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { validateUploadBuffer } from '../src/services/uploadValidation.ts';

test('accepts a JPEG with matching extension and MIME and hashes actual bytes', () => {
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const result = validateUploadBuffer('result.jpg', bytes, 'image/jpeg');
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.sizeBytes, bytes.length);
    assert.equal(result.sha256.length, 64);
  }
});

test('rejects extension/MIME spoofing and unsupported content', () => {
  assert.equal(validateUploadBuffer('fake.png', Buffer.from('not an image'), 'image/png').valid, false);
  assert.equal(validateUploadBuffer('file.pdf', Buffer.from('%PDF-1.7'), 'image/jpeg').valid, false);
  assert.equal(validateUploadBuffer('file.exe', Buffer.from('MZ')).valid, false);
});

test('rejects path traversal and oversized files', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(validateUploadBuffer('../result.jpg', jpeg, 'image/jpeg').valid, false);
  assert.equal(validateUploadBuffer('result.jpg', jpeg, 'image/jpeg', 2).valid, false);
});

test('accepts a PDF only when its signature and declared MIME match', () => {
  const result = validateUploadBuffer('sheet.pdf', Buffer.from('%PDF-1.7\n'), 'application/pdf');
  assert.equal(result.valid, true);
});
