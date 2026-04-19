import type { ReporterContext } from '../../../@types/reporters.js';
import { copyV8JsonsTo } from '../copy.js';

const run = (context: ReporterContext): void => {
  copyV8JsonsTo(context.tempDir, context.reportsDir);
};

export const deno = { run } as const;
