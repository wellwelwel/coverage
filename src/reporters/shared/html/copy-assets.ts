import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const copyAssetSet = (
  reportsDir: string,
  assetsDir: string,
  filenames: readonly string[]
): void => {
  mkdirSync(reportsDir, { recursive: true });

  for (const filename of filenames)
    copyFileSync(join(assetsDir, filename), join(reportsDir, filename));
};
