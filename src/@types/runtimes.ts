import type { ChildProcess } from 'node:child_process';
import type { PluginContext } from 'poku/plugins';
import type { CoverageOptions, CoverageState } from './coverage.js';

export type DataListener = (chunk: Buffer | string) => void;

export type RuntimeHandler = {
  setup: (
    context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ) => void;
  runner: (command: string[], file: string, state: CoverageState) => string[];
  onTestProcess?: (
    child: ChildProcess,
    file: string,
    state: CoverageState
  ) => void;
  teardown: (
    context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ) => void;
};
