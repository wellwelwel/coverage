import { defineConfig } from 'poku';
import { coverage } from '../../../../../../lib/index.js';

export default defineConfig({
  quiet: true,
  plugins: [
    coverage({
      reporter: ['text'],
      watermarks: {
        lines: [70, 95],
        statements: [70, 95],
        functions: [70, 95],
        branches: [70, 95],
      },
    }),
  ],
});
