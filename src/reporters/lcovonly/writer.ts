import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const writeLcovFile = (reportsDir: string, content: string): void => {
  if (content.length === 0) return;

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(join(reportsDir, 'lcov.info'), content, 'utf8');
};
