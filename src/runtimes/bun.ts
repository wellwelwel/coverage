import type { ChildProcess } from 'node:child_process';
import type { PluginContext } from 'poku/plugins';
import type { CoverageOptions, CoverageState } from '../@types/coverage.js';
import type { DataListener } from '../@types/runtimes.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escapeRegex, slug } from '../utils/strings.js';
import { setup, teardown } from './lifecycle.js';

const NOISE_PATTERNS: RegExp[] = [
  /^bun test v\d/,
  /^\s*\d+\s+(pass|fail)\s*$/,
  /^Ran \d+ tests? across /,
];

const makeLineFilter = (
  file: string,
  downstream: DataListener[]
): DataListener => {
  const fileHeader = new RegExp(`^${escapeRegex(file)}:$`);
  let buffer = '';

  const emit = (text: string): void => {
    for (const listener of downstream) listener(text);
  };

  return (chunk: Buffer | string): void => {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');

    let newlineIdx: number;
    let flushed = '';

    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);

      const trimmed = line.trim();
      const isNoise =
        NOISE_PATTERNS.some((pattern) => pattern.test(trimmed)) ||
        fileHeader.test(trimmed);

      if (!isNoise) flushed += `${line}\n`;
    }

    if (flushed.length > 0) emit(flushed);
  };
};

const onTestProcess = (
  child: ChildProcess,
  file: string,
  state: CoverageState
): void => {
  if (!state.enabled) return;

  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) continue;

    const originals = stream.listeners('data') as DataListener[];
    if (originals.length === 0) continue;

    stream.removeAllListeners('data');
    stream.on('data', makeLineFilter(file, originals));
  }
};

const runner = (
  command: string[],
  file: string,
  state: CoverageState
): string[] => {
  if (!state.enabled) return command;

  const [binary, ...rest] = command;
  const passthrough = rest.filter((arg) => arg !== file);
  const coverageDir = join(state.tempDir, slug(file));

  mkdirSync(coverageDir, { recursive: true });

  return [
    binary ?? 'bun',
    'test',
    ...passthrough,
    file,
    '--coverage',
    '--coverage-reporter=lcov',
    `--coverage-dir=${coverageDir}`,
  ];
};

export const bun = {
  setup: (
    _context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ): void => setup(options, state, 'bun'),
  runner,
  onTestProcess,
  teardown: (
    context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ): void => teardown(context, options, state, 'bun'),
} as const;
