import type { CoverageMap } from './istanbul.js';
import type { ReporterContext, Runtime } from './reporters.js';

export type AllFilesHandler = {
  discover: (context: ReporterContext) => Set<string>;
  injectLcov: (
    lcov: string,
    discovered: ReadonlySet<string>,
    cwd: string,
    runtime: Runtime
  ) => string;
  injectCoverageMap: (
    coverageMap: CoverageMap,
    discovered: ReadonlySet<string>
  ) => void;
};
