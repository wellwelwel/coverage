import type { V8Handler } from '../../@types/reporters.js';
import { bun } from './runtimes/bun.js';
import { deno } from './runtimes/deno.js';
import { node } from './runtimes/node.js';

const runtimes = { node, deno, bun };

export const v8: V8Handler = {
  runtimes,
  report: (context) => runtimes[context.runtime].run(context),
};
