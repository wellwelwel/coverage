/*
 * Adapted from v8-to-istanbul's `branch.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { BranchMapEntry, CovBranch } from '../../@types/istanbul.js';

export const createCovBranch = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  count: number
): CovBranch => ({
  startLine,
  startColumn,
  endLine,
  endColumn,
  count,
});

export const covBranchToBranchMapEntry = (
  covBranch: CovBranch
): BranchMapEntry => {
  const location = {
    start: { line: covBranch.startLine, column: covBranch.startColumn },
    end: { line: covBranch.endLine, column: covBranch.endColumn },
  };

  return {
    type: 'branch',
    line: covBranch.startLine,
    loc: location,
    locations: [{ ...location }],
  };
};
