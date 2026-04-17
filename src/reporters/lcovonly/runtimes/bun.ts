import type {
  LcovRuntimeHandler,
  ReporterContext,
} from '../../../@types/reporters.js';
import { readFileSync } from 'node:fs';
import { allFiles } from '../../../all-files.js';
import { filter } from '../filter.js';
import { findLcovInfoFiles } from '../finder.js';
import { writeLcovFile } from '../writer.js';

const produce = (context: ReporterContext): string => {
  const lcovFiles = findLcovInfoFiles(context.tempDir);
  const rawLcov =
    lcovFiles.length === 0
      ? ''
      : lcovFiles.map((filePath) => readFileSync(filePath, 'utf8')).join('');

  const filtered = filter(
    rawLcov,
    context.testFiles,
    context.cwd,
    context.fileFilter
  );

  if (context.options.all !== true) return filtered;
  return allFiles.injectLcov(
    filtered,
    allFiles.discover(context),
    context.cwd,
    'bun'
  );
};

const run = (context: ReporterContext): void => {
  writeLcovFile(context.reportsDir, produce(context));
};

export const bun: LcovRuntimeHandler = { produce, run };
