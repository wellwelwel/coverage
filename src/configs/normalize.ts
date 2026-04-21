import type { CheckCoverageMetric } from '../@types/check-coverage.js';
import type { CoverageOptions } from '../@types/coverage.js';

const kebabMap: Record<string, string> = {
  'reports-dir': 'reportsDirectory',
  'report-dir': 'reportsDirectory',
  'temp-directory': 'tempDirectory',
  'check-coverage': 'checkCoverage',
  'per-file': 'perFile',
  'skip-full': 'skipFull',
  'exclude-after-remap': 'excludeAfterRemap',
};

const thresholdMetrics: readonly CheckCoverageMetric[] = [
  'statements',
  'branches',
  'functions',
  'lines',
];

const normalize = (raw: Record<string, unknown>): CoverageOptions => {
  const mapped: Record<string, unknown> = Object.create(null);

  for (const [key, value] of Object.entries(raw))
    mapped[kebabMap[key] ?? key] = value;

  if (mapped['100'] === true) {
    mapped.checkCoverage = 100;
    mapped.perFile = undefined;

    for (const metric of thresholdMetrics) mapped[metric] = undefined;

    return mapped;
  }

  if (typeof mapped.checkCoverage !== 'boolean') return mapped;

  if (mapped.checkCoverage === false) {
    mapped.checkCoverage = undefined;
    mapped.perFile = undefined;

    for (const metric of thresholdMetrics) mapped[metric] = undefined;

    return mapped;
  }

  const thresholds: Record<string, unknown> = Object.create(null);
  let hasThreshold = false;

  for (const metric of thresholdMetrics) {
    if (mapped[metric] !== undefined) {
      thresholds[metric] = mapped[metric];
      hasThreshold = true;
    }

    mapped[metric] = undefined;
  }

  if (mapped.perFile !== undefined) {
    thresholds.perFile = mapped.perFile;
    hasThreshold = true;
    mapped.perFile = undefined;
  }

  mapped.checkCoverage = hasThreshold ? thresholds : undefined;

  return mapped;
};

export const configNormalize = { normalize } as const;
