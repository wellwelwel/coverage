import { readFileSync } from 'node:fs';
import { paths } from '../paths.ts';

const raw = (fixtureRoot: string, filename: string): string =>
  readFileSync(`${fixtureRoot}/coverage/${filename}`, 'utf8');

const read = (fixtureRoot: string, filename: string): string =>
  paths.normalizeXml(raw(fixtureRoot, filename), fixtureRoot);

export const xml = {
  read,
  raw,
} as const;
