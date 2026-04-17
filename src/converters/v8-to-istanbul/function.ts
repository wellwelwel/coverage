/*
 * Adapted from v8-to-istanbul's `function.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { CovFunction, FnMapEntry } from '../../@types/istanbul.js';

export const createCovFunction = (
  name: string,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  count: number
): CovFunction => ({
  name,
  startLine,
  startColumn,
  endLine,
  endColumn,
  count,
});

export const covFunctionToFnMapEntry = (
  covFunction: CovFunction
): FnMapEntry => {
  const declaration = {
    start: { line: covFunction.startLine, column: covFunction.startColumn },
    end: { line: covFunction.endLine, column: covFunction.endColumn },
  };

  return {
    name: covFunction.name,
    decl: declaration,
    loc: { ...declaration },
    line: covFunction.startLine,
  };
};
