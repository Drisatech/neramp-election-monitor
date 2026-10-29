export type IngestionOutcome =
  | 'SUCCEEDED'
  | 'PARTIAL_SUCCESS'
  | 'SIMULATED'
  | 'FAILED'
  | 'VALIDATION_REJECTED'
  | 'SUCCEEDED_EMPTY';

export class IngestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IngestionValidationError';
  }
}

export interface IngestionOutcomeInput {
  isSimulation?: boolean;
  retrievalFailed?: boolean;
  validationRejected?: boolean;
  failedWardFetches?: number;
  recordsRetrieved?: number;
}

/**
 * Classify an ingestion attempt from observed retrieval outcomes.
 * Existing local records are deliberately not an input: they are not newly retrieved source data.
 */
export function classifyIngestionOutcome(input: IngestionOutcomeInput): IngestionOutcome {
  if (input.isSimulation) return 'SIMULATED';
  if (input.validationRejected) return 'VALIDATION_REJECTED';
  if (input.retrievalFailed) return 'FAILED';

  const failedWardFetches = Math.max(0, input.failedWardFetches ?? 0);
  const recordsRetrieved = Math.max(0, input.recordsRetrieved ?? 0);

  if (failedWardFetches > 0) {
    return recordsRetrieved > 0 ? 'PARTIAL_SUCCESS' : 'FAILED';
  }
  return recordsRetrieved > 0 ? 'SUCCEEDED' : 'SUCCEEDED_EMPTY';
}

/** Require HTTPS and a parseable absolute URL for configured upstreams. */
export function validateUpstreamBaseUrl(value: string | undefined | null): URL {
  if (!value?.trim()) {
    throw new IngestionValidationError('Live ingestion is disabled until a documented, authorized upstream API URL is configured.');
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new IngestionValidationError('Configured upstream API URL must be a valid absolute HTTPS URL.');
  }
  if (url.protocol !== 'https:') {
    throw new IngestionValidationError('Configured upstream API URL must use HTTPS.');
  }
  return url;
}
