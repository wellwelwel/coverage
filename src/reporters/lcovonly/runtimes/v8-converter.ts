import type {
  LcovRuntimeHandler,
  ReporterContext,
} from '../../../@types/reporters.js';
import { allFiles } from '../../../all-files.js';
import { converters } from '../../../converters/index.js';
import { filter } from '../filter.js';
import { writeLcovFile } from '../writer.js';

const produce = (context: ReporterContext): string => {
  const filtered = filter(
    converters.v8ToLcov(context.tempDir, context.cwd, context.preRemapFilter),
    context.testFiles,
    context.cwd,
    context.fileFilter
  );

  if (context.options.all !== true) return filtered;
  return allFiles.injectLcov(
    filtered,
    allFiles.discover(context),
    context.cwd,
    context.runtime
  );
};

const run = (context: ReporterContext): void => {
  writeLcovFile(context.reportsDir, produce(context));
};

export const v8ConverterRuntime: LcovRuntimeHandler = { produce, run };
