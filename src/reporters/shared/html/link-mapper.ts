import { posix } from 'node:path';

export const pagePathForDirectory = (relativePath: string): string =>
  relativePath.length === 0 ? 'index.html' : `${relativePath}/index.html`;

export const pagePathForFile = (relativePath: string): string =>
  `${relativePath}.html`;

export const relativeHref = (fromPagePath: string, toPath: string): string => {
  const fromDirectory = posix.dirname(fromPagePath);
  const relative = posix.relative(fromDirectory, toPath);

  return relative.length === 0 ? '.' : relative;
};
