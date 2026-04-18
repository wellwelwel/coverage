import { readFileSync } from 'node:fs';
import { xmlShared } from './shared/xml.ts';

const raw = (fixtureRoot: string, filename: string): string =>
  readFileSync(`${fixtureRoot}/coverage/${filename}`, 'utf8');

const read = (fixtureRoot: string, filename: string): string => {
  const parsed = xmlShared.parse(raw(fixtureRoot, filename));

  return xmlShared.formatParsed(parsed, fixtureRoot);
};

export const xml = {
  read,
  raw,
} as const;
