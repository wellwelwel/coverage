/*
 * Adapted from v8-to-istanbul's `line.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { CovLine, StatementMapEntry } from '../../@types/istanbul.js';

const NEWLINE_PATTERN = /\r?\n$/u;

export const createCovLine = (
  lineNumber: number,
  startColumn: number,
  lineText: string
): CovLine => {
  const newlineMatch = lineText.match(NEWLINE_PATTERN);
  const newlineLength = newlineMatch ? newlineMatch[0].length : 0;

  return {
    line: lineNumber,
    startColumn,
    endColumn: startColumn + lineText.length - newlineLength,
    count: 1,
    ignore: false,
  };
};

export const covLineToStatementMapEntry = (
  covLine: CovLine
): StatementMapEntry => ({
  start: { line: covLine.line, column: 0 },
  end: {
    line: covLine.line,
    column: covLine.endColumn - covLine.startColumn,
  },
});
