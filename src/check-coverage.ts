import type {
  CheckCoverageFailure,
  CheckCoverageHandler,
  CheckCoverageInput,
  CheckCoverageMetric,
  CheckCoverageThresholds,
} from './@types/check-coverage.js';
import type { ReporterContext } from './@types/reporters.js';
import type { Metric } from './@types/text.js';
import type { CoverageModel } from './@types/tree.js';
import { relative } from 'node:path';
import process from 'node:process';
import { lcovonly } from './reporters/lcovonly/index.js';
import { colorForPct, colorize } from './reporters/shared/color.js';
import {
  aggregateLines,
  aggregateMetric,
  pctValue,
} from './reporters/shared/metrics.js';
import { warnOnce } from './utils/warn-once.js';

const DEFAULT_THRESHOLDS: CheckCoverageThresholds = {
  statements: 0,
  branches: 0,
  functions: 0,
  lines: 0,
  perFile: false,
};

const METRIC_ORDER: readonly CheckCoverageMetric[] = [
  'statements',
  'branches',
  'functions',
  'lines',
];

const METRIC_LABEL_WIDTH = 11;

const isValidPercentage = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;

const getDefault = (): CheckCoverageThresholds => ({ ...DEFAULT_THRESHOLDS });

const normalize = (
  custom: CheckCoverageInput | undefined
): CheckCoverageThresholds => {
  const resolved = getDefault();

  if (custom === undefined) return resolved;

  if (typeof custom === 'number') {
    if (!isValidPercentage(custom)) return resolved;

    for (const metric of METRIC_ORDER) resolved[metric] = custom;

    return resolved;
  }

  for (const metric of METRIC_ORDER) {
    const entry = custom[metric];
    if (isValidPercentage(entry)) resolved[metric] = entry;
  }

  if (typeof custom.perFile === 'boolean') resolved.perFile = custom.perFile;

  return resolved;
};

const hasAnyThreshold = (resolved: CheckCoverageThresholds): boolean =>
  resolved.statements > 0 ||
  resolved.branches > 0 ||
  resolved.functions > 0 ||
  resolved.lines > 0;

const metricForName = (
  metric: CheckCoverageMetric,
  files: CoverageModel
): Metric => {
  if (metric === 'statements' || metric === 'lines')
    return aggregateLines(files);

  if (metric === 'branches')
    return aggregateMetric(files, (file) => file.branches);

  return aggregateMetric(files, (file) => file.functions);
};

const BUN_BRANCHES_WARNING =
  '[@pokujs/coverage] check-coverage: skipping "branches" threshold on Bun — native LCOV output has no branch records. Configure other metrics or run on Node/Deno for branch enforcement.';

const collectFailures = (
  files: CoverageModel,
  thresholds: CheckCoverageThresholds,
  runtime: ReporterContext['runtime']
): CheckCoverageFailure[] => {
  const failures: CheckCoverageFailure[] = [];

  const scopes: Array<{ scope: string; files: CoverageModel }> =
    thresholds.perFile
      ? files.map((file) => ({ scope: file.file, files: [file] }))
      : [{ scope: 'total', files }];

  for (const metric of METRIC_ORDER) {
    const threshold = thresholds[metric];
    if (threshold <= 0) continue;

    for (const entry of scopes) {
      const computed = metricForName(metric, entry.files);
      const actual = pctValue(computed);

      if (actual === null) {
        if (metric === 'branches' && runtime === 'bun') {
          warnOnce('check-coverage-bun-branches', BUN_BRANCHES_WARNING);
        }

        continue;
      }

      if (actual < threshold)
        failures.push({ scope: entry.scope, metric, threshold, actual });
    }
  }

  return failures;
};

const padMetricLabel = (metric: CheckCoverageMetric): string =>
  metric.length < METRIC_LABEL_WIDTH
    ? metric + ' '.repeat(METRIC_LABEL_WIDTH - metric.length)
    : metric;

const formatFailureLine = (
  failure: CheckCoverageFailure,
  context: ReporterContext
): string => {
  const label = padMetricLabel(failure.metric);
  const actualText = `${failure.actual!.toFixed(2)}%`;
  const thresholdText = `(threshold: ${failure.threshold}%)`;
  const colorName = colorForPct(
    context.watermarks,
    failure.metric,
    failure.actual
  );

  return `  ${label} ${colorize(actualText, colorName)} ${thresholdText}`;
};

const printFailures = (
  failures: CheckCoverageFailure[],
  context: ReporterContext
): void => {
  console.error('');
  console.error(
    colorize('[@pokujs/coverage] coverage threshold not met:', 'red')
  );

  const grouped = new Map<string, CheckCoverageFailure[]>();

  for (const failure of failures) {
    const existing = grouped.get(failure.scope);

    if (existing) existing.push(failure);
    else grouped.set(failure.scope, [failure]);
  }

  for (const [scope, entries] of grouped) {
    if (scope !== 'total') {
      const relativePath = relative(context.cwd, scope) || scope;

      console.error(`  ${relativePath}`);
    }

    for (const failure of entries)
      console.error(formatFailureLine(failure, context));
  }

  console.error('');
};

const run = (context: ReporterContext): void => {
  const custom = context.options.checkCoverage;
  if (custom === undefined) return;

  const thresholds = normalize(custom);
  if (!hasAnyThreshold(thresholds)) return;

  const lcovOutput = lcovonly.runtimes[context.runtime].produce(context);
  if (lcovOutput.length === 0) return;

  const model = lcovonly.parse(lcovOutput, context.cwd);
  if (model.length === 0) return;

  const failures = collectFailures(model, thresholds, context.runtime);
  if (failures.length === 0) return;

  printFailures(failures, context);

  process.exitCode = 1;
};

export const checkCoverage: CheckCoverageHandler = {
  getDefault,
  normalize,
  run,
};
