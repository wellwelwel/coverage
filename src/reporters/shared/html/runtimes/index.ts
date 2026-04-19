import { bun } from './bun.js';
import { deno } from './deno.js';
import { node } from './node.js';

export const htmlRuntimes = { node, deno, bun } as const;
