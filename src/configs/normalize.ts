import type { CheckCoverageMetric } from '../@types/check-coverage.js';
import type { CoverageOptions } from '../@types/coverage.js';

const thresholdMetrics: readonly CheckCoverageMetric[] = [
  'statements',
  'branches',
  'functions',
  'lines',
];

const clearThresholds = (mapped: CoverageOptions): void => {
  for (const metric of thresholdMetrics) mapped[metric] = undefined;
  mapped.perFile = undefined;
};

const normalize = (raw: Record<string, unknown>): CoverageOptions => {
  const mapped: CoverageOptions = { ...raw };

  if (mapped.checkCoverage === false) {
    mapped.checkCoverage = undefined;
    clearThresholds(mapped);
  }

  return mapped;
};

export const configNormalize = { normalize } as const;
