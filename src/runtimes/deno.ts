import type { RuntimeHandler } from '../@types/runtimes.js';
import { setup, teardown } from './lifecycle.js';

const ENV_VAR = 'DENO_COVERAGE_DIR';

export const deno: RuntimeHandler = {
  setup: (_context, options, state) => setup(options, state, 'deno', ENV_VAR),
  runner: (command) => command,
  teardown: (context, options, state) =>
    teardown(context, options, state, 'deno', ENV_VAR),
};
