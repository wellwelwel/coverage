import type { LcovFile } from 'lcov-parse';
import { readFileSync } from 'node:fs';
import parse from 'lcov-parse';

const FIXTURE_PATH_PATTERN =
  /^.*\/test\/__fixtures__\/e2e\/[^/]+\/[^/]+\/[^/]+\//;

const raw = (fixtureRoot: string): string =>
  readFileSync(`${fixtureRoot}/coverage/lcov.info`, 'utf8');

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

const read = async (fixtureRoot: string): Promise<string> => {
  const parsed = await parseLcov(raw(fixtureRoot));
  const normalized = parsed.map((fileCoverage) => ({
    ...fileCoverage,
    file: normalizeFilePath(fileCoverage.file, fixtureRoot),
  }));

  normalized.sort((left, right) => left.file.localeCompare(right.file));

  return JSON.stringify(normalized, null, 2);
};

export const lcov = {
  read,
  raw,
} as const;
