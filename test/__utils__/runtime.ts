import type { ReporterName, Runtime } from '../../src/@types/reporters.js';
import type { Platform, RuntimeSpec } from '../../src/@types/tests.ts';
import { platform as currentPlatform } from 'node:process';

const reset = {
  poku: {
    POKU_RUNTIME: undefined,
    POKU_REPORTER: undefined,
    POKU_TEST_NAME_PATTERN: undefined,
    POKU_TEST_SKIP_PATTERN: undefined,
  },
};

const isWindows = currentPlatform === 'win32';

export const runtimeSpecs: Record<Runtime, RuntimeSpec> = {
  node: {
    command: isWindows ? 'npx.cmd' : 'poku',
    args: isWindows ? ['poku'] : [],
    env: { ...reset.poku, NODE_V8_COVERAGE: undefined },
  },
  deno: {
    command: 'deno',
    args: ['run', '-A', 'npm:poku'],
    env: { ...reset.poku, DENO_COVERAGE_DIR: undefined },
  },
  bun: {
    command: 'bun',
    args: ['--bun', 'poku'],
    env: reset.poku,
  },
};

export const runtimes: Runtime[] = ['node', 'bun', 'deno'] as const;

const bunSupports = new Set<ReporterName>([
  'text',
  'lcov',
  'lcovonly',
  'text-lcov',
  'teamcity',
  'json-summary',
  'cobertura',
  'clover',
  'none',
]);

const runtimesByPlatform: Record<Platform, readonly Runtime[]> = {
  darwin: ['node'],
  linux: ['node', 'bun', 'deno'],
  win32: ['node'],
};

const platformRuntimes = (): readonly Runtime[] =>
  runtimesByPlatform[currentPlatform as Platform] ?? ['node'];

export const runtimesFor = (reporter: ReporterName): Runtime[] => {
  const supportedByPlatform = platformRuntimes();
  const supportedByReporter = bunSupports.has(reporter)
    ? runtimes
    : runtimes.filter((runtime) => runtime !== 'bun');

  return supportedByReporter.filter((runtime) =>
    supportedByPlatform.includes(runtime)
  );
};
