import { readFileSync } from 'node:fs';
import { paths } from '../paths.ts';

const raw = (fixtureRoot: string): string =>
  readFileSync(`${fixtureRoot}/coverage/lcov.info`, 'utf8');

const read = (fixtureRoot: string): string =>
  paths.normalizeLcov(raw(fixtureRoot), fixtureRoot);

export const lcov = {
  read,
  raw,
} as const;
