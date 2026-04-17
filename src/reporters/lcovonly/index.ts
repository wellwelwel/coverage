import type { LcovOnlyHandler } from '../../@types/reporters.js';
import { filter } from './filter.js';
import { parse } from './parse.js';
import { bun } from './runtimes/bun.js';
import { deno } from './runtimes/deno.js';
import { node } from './runtimes/node.js';

const runtimes = { node, deno, bun };

export const lcovonly: LcovOnlyHandler = {
  parse,
  filter,
  runtimes,
  report: (context) => runtimes[context.runtime].run(context),
};
