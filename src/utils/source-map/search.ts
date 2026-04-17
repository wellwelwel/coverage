/*
 * Adapted from @jridgewell/trace-mapping's `binary-search.ts`.
 * Original: https://github.com/jridgewell/sourcemaps
 * Copyright 2024 Justin Ridgewell
 * MIT License
 */

import type { ColumnTuple, SearchMemo } from '../../@types/source-map.js';
import { COLUMN } from './segment.js';

export const binarySearchSegments = <Segment extends ColumnTuple>(
  haystack: readonly Segment[],
  needle: number,
  low: number,
  high: number,
  searchMemo: SearchMemo
): number => {
  while (low <= high) {
    const middle = low + ((high - low) >> 1);
    const comparison = haystack[middle][COLUMN] - needle;

    if (comparison === 0) {
      searchMemo.lastFound = true;
      return middle;
    }

    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }

  searchMemo.lastFound = false;
  return low - 1;
};

export const upperBound = <Segment extends ColumnTuple>(
  haystack: readonly Segment[],
  needle: number,
  index: number
): number => {
  for (
    let probeIndex = index + 1;
    probeIndex < haystack.length;
    index = probeIndex++
  )
    if (haystack[probeIndex][COLUMN] !== needle) break;
  return index;
};

export const lowerBound = <Segment extends ColumnTuple>(
  haystack: readonly Segment[],
  needle: number,
  index: number
): number => {
  for (let probeIndex = index - 1; probeIndex >= 0; index = probeIndex--)
    if (haystack[probeIndex][COLUMN] !== needle) break;
  return index;
};

export const createSearchMemo = (): SearchMemo => ({
  lastKey: -1,
  lastNeedle: -1,
  lastIndex: -1,
  lastFound: false,
});

export const memoizedBinarySearchSegments = <Segment extends ColumnTuple>(
  haystack: readonly Segment[],
  needle: number,
  searchMemo: SearchMemo,
  key: number
): number => {
  const { lastKey, lastNeedle, lastIndex } = searchMemo;

  let low = 0;
  let high = haystack.length - 1;

  if (key === lastKey) {
    if (needle === lastNeedle) {
      searchMemo.lastFound =
        lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
      return lastIndex;
    }

    if (needle >= lastNeedle) low = lastIndex === -1 ? 0 : lastIndex;
    else high = lastIndex;
  }

  searchMemo.lastKey = key;
  searchMemo.lastNeedle = needle;
  searchMemo.lastIndex = binarySearchSegments(
    haystack,
    needle,
    low,
    high,
    searchMemo
  );
  return searchMemo.lastIndex;
};
