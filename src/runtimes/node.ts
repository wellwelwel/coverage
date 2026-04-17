import type { RuntimeHandler } from '../@types/runtimes.js';
import { setup, teardown } from './lifecycle.js';

const ENV_VAR = 'NODE_V8_COVERAGE';

export const node: RuntimeHandler = {
  setup: (_context, options, state) => setup(options, state, 'node', ENV_VAR),
  runner: (command) => command,
  teardown: (context, options, state) =>
    teardown(context, options, state, 'node', ENV_VAR),
};
