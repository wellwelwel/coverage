import type { ConfigHandler, CoverageOptions } from './@types/coverage.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const isScript = (path: string): boolean =>
  scriptExtensions.has(getExtension(path));

const isToml = (path: string): boolean => getExtension(path) === '.toml';

const isYaml = (path: string): boolean => {
  const extension = getExtension(path);
  return extension === '.yml' || extension === '.yaml';
};

const getExtension = (filePath: string): string => {
  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filePath.slice(dotIndex);
};

const parseConfig = (content: string, filePath: string): CoverageOptions => {
  if (isToml(filePath)) return tomlParse<CoverageOptions>(content);
  if (isYaml(filePath)) return yamlParse<CoverageOptions>(content);
  return JSONC.parse<CoverageOptions>(content);
};

const load = (cwd: string, customPath?: string | false): CoverageOptions => {
  if (customPath === false) return Object.create(null);

  const expectedFiles = customPath
    ? [customPath]
    : [
        '.coverage.json',
        '.coverage.jsonc',
        '.coverage.toml',
        '.coverage.yaml',
        '.coverage.yml',
        '.coverage',
        '.coveragerc',
        '.nycrc',
        '.nycrc.json',
        '.nycrc.jsonc',
        '.nycrc.toml',
        '.nycrc.yaml',
        '.nycrc.yml',
      ];

  for (const file of expectedFiles) {
    if (isScript(file)) continue;

    const filePath = join(cwd, file);

    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, 'utf8');

      return parseConfig(content, file);
    } catch {}
  }

  return Object.create(null);
};

export const config: ConfigHandler = { load };
