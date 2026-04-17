import type { ConvertersHandler } from '../@types/converters.js';
import { discoverBranches } from './discover-branches.js';
import { v8ToIstanbul } from './v8-to-istanbul/index.js';
import { v8ToLcov } from './v8-to-lcov/index.js';

export const converters: ConvertersHandler = {
  v8ToLcov,
  v8ToIstanbul,
  discoverBranches,
};
