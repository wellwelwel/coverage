import type { CoverageOptions } from '../@types/coverage.js';

const extract = (raw: Record<string, unknown>): CoverageOptions => {
  const mapped: CoverageOptions = Object.create(null);
  const { coverageDir, coverageReporter, coveragePathIgnorePatterns } =
    raw.test ?? Object.create(null);

  if (coverageDir !== undefined) mapped.reportsDirectory = coverageDir;
  if (coverageReporter !== undefined) mapped.reporter = coverageReporter;
  if (coveragePathIgnorePatterns !== undefined)
    mapped.exclude =
      typeof coveragePathIgnorePatterns === 'string'
        ? [coveragePathIgnorePatterns]
        : coveragePathIgnorePatterns;

  return mapped;
};

export const bunfig = { extract } as const;
