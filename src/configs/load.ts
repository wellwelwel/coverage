import type { CoverageOptions } from '../@types/coverage.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bunfig } from './bunfig.js';
import { configNormalize } from './normalize.js';
import { nycrc } from './nycrc.js';
import { configParse } from './parse.js';

const load = (cwd: string, customPath?: string | false): CoverageOptions => {
  if (customPath === false) return Object.create(null);

  const expectedFiles = customPath
    ? [customPath]
    : [
        '.coveragerc',
        '.coveragerc.json',
        '.coveragerc.jsonc',
        '.coveragerc.toml',
        '.coveragerc.yaml',
        '.coveragerc.yml',
        '.nycrc',
        '.nycrc.json',
        '.c8rc',
        '.c8rc.json',
        'bunfig.toml',
      ];

  for (const file of expectedFiles) {
    if (configParse.isScript(file)) continue;

    const filePath = join(cwd, file);
    if (!existsSync(filePath)) continue;

    let content: string;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const parsed = configParse.parse(content, file);
    const remapped: CoverageOptions =
      file === 'bunfig.toml'
        ? bunfig.extract(parsed)
        : file.startsWith('.nycrc') || file.startsWith('.c8rc')
          ? nycrc.extract(parsed)
          : parsed;

    return configNormalize.normalize(remapped);
  }

  return Object.create(null);
};

export const configLoad = { load } as const;
