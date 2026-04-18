import type { LcovFile } from 'lcov-parse';
import parse from 'lcov-parse';

const FIXTURE_PATH_PATTERN =
  /^.*\/test\/__fixtures__\/e2e\/[^/]+\/[^/]+\/[^/]+\//;

const normalizeFilePath = (filePath: string, fixtureRoot: string): string => {
  const prefix = `${fixtureRoot}/`;

  if (filePath.startsWith(prefix)) return filePath.slice(prefix.length);

  return filePath.replace(FIXTURE_PATH_PATTERN, '');
};

const parseContent = (content: string): Promise<LcovFile[]> =>
  new Promise((resolve, reject) => {
    parse.source(content, (error, data) => {
      if (error !== null) return reject(new Error(error));
      if (data === undefined)
        return reject(new Error('lcov-parse returned no data'));

      resolve(data);
    });
  });

const formatParsed = (parsed: LcovFile[], fixtureRoot: string): string => {
  const normalized = parsed.map((fileCoverage) => ({
    ...fileCoverage,
    file: normalizeFilePath(fileCoverage.file, fixtureRoot),
  }));

  normalized.sort((left, right) => left.file.localeCompare(right.file));

  return JSON.stringify(normalized, null, 2);
};

export const lcovShared = {
  parse: parseContent,
  formatParsed,
} as const;
