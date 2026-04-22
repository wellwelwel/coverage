import type { CheckCoverageMetric } from '../@types/check-coverage.js';
import type { CoverageOptions } from '../@types/coverage.js';
import type { NycrcMap, NycrcRaw } from '../@types/nycrc.js';

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

const aliasMap: Record<keyof NycrcMap, keyof CoverageOptions> = {
  'reports-dir': 'reportsDirectory',
  'report-dir': 'reportsDirectory',
  'temp-directory': 'tempDirectory',
  'check-coverage': 'checkCoverage',
  'per-file': 'perFile',
  'skip-full': 'skipFull',
  'exclude-after-remap': 'excludeAfterRemap',
  '100': 'checkCoverage',
} as const;

const extract = (source: NycrcRaw): CoverageOptions => {
  const mapped: CoverageOptions = Object.create(null);

  for (const [key, value] of Object.entries(source)) {
    if (key === '100') continue;

    const destination =
      (aliasMap as Record<string, keyof CoverageOptions>)[key] ?? key;

    (mapped as Record<string, unknown>)[destination] = value;
  }

  if (source['100'] === true) {
    mapped.checkCoverage = 100;

    clearThresholds(mapped);
  }

  return mapped;
};

export const nycrc = { extract } as const;
