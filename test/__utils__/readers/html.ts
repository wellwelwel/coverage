import { readdirSync, readFileSync } from 'node:fs';
import { posix, relative, sep } from 'node:path';
import { paths } from '../paths.ts';

const collectHtmlFiles = (
  directory: string,
  coverageRoot: string,
  accumulator: Map<string, string>
): void => {
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      collectHtmlFiles(absolutePath, coverageRoot, accumulator);
      continue;
    }

    if (!entry.name.endsWith('.html')) continue;

    const rawContent = readFileSync(absolutePath, 'utf8');
    const relativePath = relative(coverageRoot, absolutePath)
      .split(sep)
      .join(posix.sep);

    accumulator.set(relativePath, paths.normalizeHtml(rawContent));
  }
};

const read = (fixtureRoot: string, subdir = ''): Map<string, string> => {
  const accumulator = new Map<string, string>();
  const coverageRoot =
    subdir === ''
      ? `${fixtureRoot}/coverage`
      : `${fixtureRoot}/coverage/${subdir}`;

  collectHtmlFiles(coverageRoot, coverageRoot, accumulator);

  return accumulator;
};

export const html = {
  read,
} as const;
