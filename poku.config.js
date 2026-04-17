// @ts-check

import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'poku';
import { coverage } from './lib/index.js';

const clean = async (
  directory = fileURLToPath(
    new URL('./test/__fixtures__/e2e/', import.meta.url)
  )
) => {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) => {
      if (!entry.isDirectory()) return;

      const entryPath = join(directory, entry.name);

      if (entry.name === 'coverage') {
        return rm(entryPath, { recursive: true, force: true });
      }

      return clean(entryPath);
    })
  );
};

export default defineConfig({
  include: ['test/e2e'],
  timeout: 30000,
  plugins: [
    {
      setup: async () => {
        console.log('› Deleting previous coverage reports...');
        await clean();
      },
      teardown: () => {
        console.log('› Coverage reports are preserved for debugging purposes.');
      },
    },
    coverage({
      requireFlag: true,
      all: true,
      include: ['lib'],
      exclude: ['@types', '*.ts'],
    }),
  ],
});
