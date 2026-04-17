/*
 * Adapted from v8-to-istanbul's `range.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { CovLine } from '../../@types/istanbul.js';

export const sliceRange = (
  lines: CovLine[],
  startColumn: number,
  endColumn: number,
  inclusive = false
): CovLine[] => {
  const adjustedStart = inclusive ? startColumn - 1 : startColumn;

  let low = 0;
  let high = lines.length;

  while (low < high) {
    let middle = (low + high) >> 1;

    if (adjustedStart >= lines[middle].endColumn) {
      low = middle + 1;
    } else if (endColumn < lines[middle].startColumn) {
      high = middle - 1;
    } else {
      high = middle;

      while (
        middle >= 0 &&
        adjustedStart < lines[middle].endColumn &&
        endColumn >= lines[middle].startColumn
      ) {
        middle--;
      }

      low = middle + 1;
      break;
    }
  }

  while (
    high < lines.length &&
    adjustedStart < lines[high].endColumn &&
    endColumn >= lines[high].startColumn
  ) {
    high++;
  }

  return lines.slice(low, high);
};
