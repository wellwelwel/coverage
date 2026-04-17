import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const copyV8JsonsTo = (tempDir: string, reportsDir: string): void => {
  let entries: string[];

  try {
    entries = readdirSync(tempDir);
  } catch {
    return;
  }

  const jsonFiles = entries.filter((name) => name.endsWith('.json'));
  if (jsonFiles.length === 0) return;

  const targetDir = join(reportsDir, 'v8');
  mkdirSync(targetDir, { recursive: true });

  for (const name of jsonFiles)
    copyFileSync(join(tempDir, name), join(targetDir, name));
};
