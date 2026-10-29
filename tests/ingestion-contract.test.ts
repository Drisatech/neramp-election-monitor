import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyIngestionOutcome, validateUpstreamBaseUrl } from '../src/services/ingestionContract.ts';

test('failed live retrieval is never classified as success', () => {
  assert.equal(classifyIngestionOutcome({ retrievalFailed: true, recordsRetrieved: 0 }), 'FAILED');
  assert.equal(classifyIngestionOutcome({ retrievalFailed: true, recordsRetrieved: 12 }), 'FAILED');
});

test('partial retrieval has a distinct outcome', () => {
  assert.equal(classifyIngestionOutcome({ failedWardFetches: 2, recordsRetrieved: 4 }), 'PARTIAL_SUCCESS');
  assert.equal(classifyIngestionOutcome({ failedWardFetches: 2, recordsRetrieved: 0 }), 'FAILED');
});

test('empty successful retrieval is distinct from failure', () => {
  assert.equal(classifyIngestionOutcome({ recordsRetrieved: 0 }), 'SUCCEEDED_EMPTY');
  assert.equal(classifyIngestionOutcome({ recordsRetrieved: 4 }), 'SUCCEEDED');
});

test('simulation is explicit and does not require live retrieval', () => {
  assert.equal(classifyIngestionOutcome({ isSimulation: true }), 'SIMULATED');
});

test('upstream URL must be explicitly configured and HTTPS', () => {
  assert.throws(() => validateUpstreamBaseUrl(undefined), /disabled/i);
  assert.throws(() => validateUpstreamBaseUrl('not-a-url'), /valid absolute HTTPS/i);
  assert.throws(() => validateUpstreamBaseUrl('http://example.com/api'), /must use HTTPS/i);
  assert.equal(validateUpstreamBaseUrl('https://example.com/api').origin, 'https://example.com');
});
