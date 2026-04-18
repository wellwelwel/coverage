import type {
  BranchArmPosition,
  DiscoveredBranch,
} from '../../@types/branch-discovery.js';
import type { ResolvedFileFilter } from '../../@types/file-filter.js';
import type { CoverageMap, FileCoverage } from '../../@types/istanbul.js';
import type { ReporterContext } from '../../@types/reporters.js';
import type { Metric } from '../../@types/text.js';
import type { CoverageModel } from '../../@types/tree.js';
import { readFileSync } from 'node:fs';
import { allFiles } from '../../all-files.js';
import { ignoreDirectives } from '../../converters/shared/ignore-directives.js';
import { fileFilter } from '../../file-filter.js';

export const filterCoverageMap = (
  coverageMap: CoverageMap,
  testFiles: ReadonlySet<string>,
  resolvedFilter: ResolvedFileFilter,
  cwd: string
): void => {
  for (const testFile of testFiles) delete coverageMap[testFile];

  for (const absolutePath of Object.keys(coverageMap))
    if (!fileFilter.matches(resolvedFilter, absolutePath, cwd))
      delete coverageMap[absolutePath];
};

export const prepareCoverageMap = (
  coverageMap: CoverageMap,
  context: ReporterContext
): void => {
  filterCoverageMap(
    coverageMap,
    context.testFiles,
    context.fileFilter,
    context.cwd
  );

  if (context.options.all === true)
    allFiles.injectCoverageMap(coverageMap, allFiles.discover(context));
};

export const lineCoverage = (
  fileCoverage: FileCoverage
): Map<number, number> => {
  const perLine = new Map<number, number>();

  for (const statementKey of Object.keys(fileCoverage.statementMap)) {
    const entry = fileCoverage.statementMap[statementKey];
    const lineNumber = entry.start.line;
    const hitCount = fileCoverage.s[statementKey] ?? 0;
    const previous = perLine.get(lineNumber);

    if (previous === undefined || previous < hitCount)
      perLine.set(lineNumber, hitCount);
  }

  return perLine;
};

export const branchCoverageByLine = (
  fileCoverage: FileCoverage
): Map<number, { covered: number; total: number }> => {
  const perLine = new Map<number, { covered: number; total: number }>();

  for (const branchKey of Object.keys(fileCoverage.branchMap)) {
    const entry = fileCoverage.branchMap[branchKey];
    const counts = fileCoverage.b[branchKey] ?? [];
    const branchTotal = counts.length;
    const branchCovered = counts.filter((count) => count > 0).length;

    if (branchTotal === 0) continue;

    const lineNumber = entry.line;
    const existing = perLine.get(lineNumber);

    if (existing === undefined)
      perLine.set(lineNumber, { covered: branchCovered, total: branchTotal });
    else {
      existing.covered += branchCovered;
      existing.total += branchTotal;
    }
  }

  return perLine;
};

export const fileStatementsMetric = (fileCoverage: FileCoverage): Metric => {
  const statementKeys = Object.keys(fileCoverage.statementMap);

  const total = statementKeys.length;
  if (total === 0) return { total: null, hit: null };

  let hit = 0;

  for (const statementKey of statementKeys)
    if ((fileCoverage.s[statementKey] ?? 0) > 0) hit++;

  return { total, hit };
};

export const fileFunctionsMetric = (fileCoverage: FileCoverage): Metric => {
  const functionKeys = Object.keys(fileCoverage.fnMap);

  const total = functionKeys.length;
  if (total === 0) return { total: null, hit: null };

  let hit = 0;

  for (const functionKey of functionKeys)
    if ((fileCoverage.f[functionKey] ?? 0) > 0) hit++;

  return { total, hit };
};

export const fileBranchesMetric = (fileCoverage: FileCoverage): Metric => {
  let total = 0;
  let hit = 0;

  for (const branchKey of Object.keys(fileCoverage.b)) {
    const counts = fileCoverage.b[branchKey];

    for (const count of counts) {
      total++;
      if (count > 0) hit++;
    }
  }

  if (total === 0) return { total: null, hit: null };
  return { total, hit };
};

const branchedLinesFor = (istanbulFile: FileCoverage): Set<number> => {
  const branchedLines = new Set<number>();

  for (const branchKey of Object.keys(istanbulFile.branchMap)) {
    branchedLines.add(istanbulFile.branchMap[branchKey].line);
  }

  return branchedLines;
};

export const applyIstanbulBranches = (
  lcovModel: CoverageModel,
  coverageMap: CoverageMap | null,
  discoveries: ReadonlyMap<string, readonly DiscoveredBranch[]>
): void => {
  if (coverageMap === null) return;

  const ignoredLinesByPath = new Map<string, ReadonlySet<number>>();
  const getIgnoredLines = (filePath: string): ReadonlySet<number> => {
    const cached = ignoredLinesByPath.get(filePath);
    if (cached !== undefined) return cached;

    try {
      const source = readFileSync(filePath, 'utf8');
      const parsed = ignoreDirectives.parseSource(source);

      ignoredLinesByPath.set(filePath, parsed);

      return parsed;
    } catch {
      const empty: ReadonlySet<number> = new Set();

      ignoredLinesByPath.set(filePath, empty);

      return empty;
    }
  };

  for (const lcovFile of lcovModel) {
    const istanbulFile = coverageMap[lcovFile.file];
    if (istanbulFile === undefined) continue;

    const uncoveredArms: BranchArmPosition[] = [];
    const istanbulMetric = fileBranchesMetric(istanbulFile);
    const fileDiscoveries = discoveries.get(lcovFile.file);

    let total = istanbulMetric.total ?? 0;
    let hit = istanbulMetric.hit ?? 0;

    if (fileDiscoveries !== undefined && fileDiscoveries.length > 0) {
      const branchedLines = branchedLinesFor(istanbulFile);
      const ignoredLines = getIgnoredLines(lcovFile.file);

      for (const discovery of fileDiscoveries) {
        const lineAlreadyCounted = branchedLines.has(discovery.line);
        const discoveryExecuted = discovery.arms.some((arm) => arm.covered);

        for (const arm of discovery.arms) {
          if (ignoredLines.has(arm.line)) continue;

          if (!lineAlreadyCounted) {
            total++;
            if (arm.covered) hit++;
          }

          if (arm.covered) continue;

          const lineExecuted =
            (lcovFile.lineHits.get(arm.line) ?? 0) > 0 || discoveryExecuted;
          if (!lineExecuted) continue;

          uncoveredArms.push({
            line: arm.line,
            column: arm.column,
            endLine: arm.endLine,
            endColumn: arm.endColumn,
            covered: false,
          });
        }
      }
    }

    lcovFile.uncoveredBranchPositions = uncoveredArms;
    lcovFile.branches =
      total === 0 ? { total: null, hit: null } : { total, hit };
  }
};
