import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_PROTOCOL = 'file://';

const baseDirectoryOf = (mapUrl: string | null | undefined): string => {
  if (mapUrl === undefined || mapUrl === null || mapUrl.length === 0) return '';
  if (mapUrl.startsWith(FILE_PROTOCOL)) return dirname(fileURLToPath(mapUrl));
  return dirname(mapUrl);
};

const normalizeSource = (source: string | null): string =>
  source === null ? '' : source;

export const createSourceResolver = (
  mapUrl: string | null | undefined,
  sourceRoot: string | undefined
): ((source: string | null) => string) => {
  const baseDirectory = baseDirectoryOf(mapUrl);
  const rootPrefix = sourceRoot ?? '';

  return (source) => {
    const sourcePath = normalizeSource(source);

    if (sourcePath.startsWith(FILE_PROTOCOL)) return fileURLToPath(sourcePath);
    if (isAbsolute(sourcePath)) return sourcePath;

    if (rootPrefix.length === 0) {
      if (baseDirectory.length === 0) return sourcePath;
      return resolve(baseDirectory, sourcePath);
    }

    if (isAbsolute(rootPrefix)) return resolve(rootPrefix, sourcePath);
    if (baseDirectory.length === 0) return resolve(rootPrefix, sourcePath);
    return resolve(baseDirectory, rootPrefix, sourcePath);
  };
};
