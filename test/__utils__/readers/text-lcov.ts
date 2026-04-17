import type { LcovFile } from 'lcov-parse';
import type { FixtureRun } from '../../../src/@types/tests.ts';
import parse from 'lcov-parse';

const FIXTURE_PATH_PATTERN =
  /^.*\/test\/__fixtures__\/e2e\/[^/]+\/[^/]+\/[^/]+\//;

const raw = (run: FixtureRun): string => run.stdout;

const parseLcov = (content: string): Promise<LcovFile[]> =>
  new Promise((resolve, reject) => {
    parse.source(content, (error, data) => {
      if (error !== null) return reject(new Error(error));
      if (data === undefined)
        return reject(new Error('lcov-parse returned no data'));

      resolve(data);
    });
  });

const normalizeFilePath = (filePath: string, fixtureRoot: string): string => {
  const prefix = `${fixtureRoot}/`;

  if (filePath.startsWith(prefix)) return filePath.slice(prefix.length);

  return filePath.replace(FIXTURE_PATH_PATTERN, '');
};

const read = async (run: FixtureRun): Promise<string> => {
  const parsed = await parseLcov(raw(run));

  const normalized = parsed.map((fileCoverage) => ({
    ...fileCoverage,
    file: normalizeFilePath(fileCoverage.file, run.fixtureRoot),
  }));

  normalized.sort((left, right) => left.file.localeCompare(right.file));

  return JSON.stringify(normalized, null, 2);
};

export const textLcov = {
  read,
  raw,
} as const;
