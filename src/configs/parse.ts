import { JSONC } from 'jsonc.min';
import { parse as tomlParse } from 'toml.min';
import { parse as yamlParse } from 'yaml.min';

const scriptExtensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
]);

const getExtension = (filePath: string): string => {
  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex === -1) return '';

  return filePath.slice(dotIndex);
};

const isScript = (path: string): boolean =>
  scriptExtensions.has(getExtension(path));

const isToml = (path: string): boolean => getExtension(path) === '.toml';

const isYaml = (path: string): boolean => {
  const extension = getExtension(path);
  return extension === '.yml' || extension === '.yaml';
};

const parse = (content: string, filePath: string): Record<string, unknown> => {
  if (isToml(filePath)) return tomlParse<Record<string, unknown>>(content);
  if (isYaml(filePath)) return yamlParse<Record<string, unknown>>(content);
  return JSONC.parse<Record<string, unknown>>(content);
};

export const configParse = { parse, isScript } as const;
