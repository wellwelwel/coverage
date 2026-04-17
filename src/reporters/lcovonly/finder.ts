import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const findLcovInfoFiles = (dir: string): string[] => {
  const results: string[] = [];
  const stack = [dir];

  while (stack.length) {
    const currentDir = stack.pop() as string;

    let entries: string[];

    try {
      entries = readdirSync(currentDir);
    } catch {
      continue;
    }

    for (const name of entries) {
      const fullPath = join(currentDir, name);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) stack.push(fullPath);
      else if (name === 'lcov.info') results.push(fullPath);
    }
  }

  return results;
};
