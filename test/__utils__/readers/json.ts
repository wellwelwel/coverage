import { readFileSync } from 'node:fs';
import { paths } from '../paths.ts';

const raw = (fixtureRoot: string): string =>
  readFileSync(`${fixtureRoot}/coverage/coverage-final.json`, 'utf8');

const read = (fixtureRoot: string): string =>
  paths.normalizeJson(raw(fixtureRoot), fixtureRoot);

export const json = {
  read,
  raw,
} as const;
