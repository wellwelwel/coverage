import type { DiscoveredBranch } from './branch-discovery.js';
import type { ResolvedFileFilter } from './file-filter.js';
import type { CoverageMap } from './istanbul.js';

export type ConvertersHandler = {
  v8ToLcov: (
    tempDir: string,
    cwd: string,
    preRemapFilter: ResolvedFileFilter
  ) => string;
  v8ToIstanbul: (
    tempDir: string,
    cwd: string,
    preRemapFilter: ResolvedFileFilter
  ) => CoverageMap;
  discoverBranches: (
    tempDir: string,
    cwd: string,
    preRemapFilter: ResolvedFileFilter
  ) => Map<string, readonly DiscoveredBranch[]>;
};
