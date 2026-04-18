import { readFileSync } from 'node:fs';
import { lcovShared } from './shared/lcov.ts';

const raw = (fixtureRoot: string): string =>
  readFileSync(`${fixtureRoot}/coverage/lcov.info`, 'utf8');

const read = async (fixtureRoot: string): Promise<string> => {
  const parsed = await lcovShared.parse(raw(fixtureRoot));

  return lcovShared.formatParsed(parsed, fixtureRoot);
};

export const lcov = {
  read,
  raw,
} as const;
