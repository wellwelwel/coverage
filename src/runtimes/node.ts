import type { PluginContext } from 'poku/plugins';
import type { CoverageOptions, CoverageState } from '../@types/coverage.js';
import { setup, teardown } from './lifecycle.js';

const ENV_VAR = 'NODE_V8_COVERAGE';

export const node = {
  setup: (
    _context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ): void => setup(options, state, 'node', ENV_VAR),
  runner: (command: string[]): string[] => command,
  onTestProcess: undefined,
  teardown: (
    context: PluginContext,
    options: CoverageOptions,
    state: CoverageState
  ): void => teardown(context, options, state, 'node', ENV_VAR),
} as const;
