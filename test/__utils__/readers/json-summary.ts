import { readFileSync } from 'node:fs';
import { paths } from '../paths.ts';

const raw = (fixtureRoot: string): string =>
  readFileSync(`${fixtureRoot}/coverage/coverage-summary.json`, 'utf8');

const read = (fixtureRoot: string): string =>
  paths.normalizeJsonSummary(raw(fixtureRoot));

export const jsonSummary = {
  read,
  raw,
} as const;
