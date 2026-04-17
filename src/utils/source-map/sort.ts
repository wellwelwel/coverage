/*
 * Adapted from @jridgewell/trace-mapping's `sort.ts`.
 * Original: https://github.com/jridgewell/sourcemaps
 * Copyright 2024 Justin Ridgewell
 * MIT License
 */

import type { ColumnTuple } from '../../@types/source-map.js';
import { COLUMN } from './segment.js';

const isLineSorted = <Segment extends ColumnTuple>(
  lineSegments: readonly Segment[]
): boolean => {
  for (let segmentIndex = 1; segmentIndex < lineSegments.length; segmentIndex++)
    if (
      lineSegments[segmentIndex][COLUMN] <
      lineSegments[segmentIndex - 1][COLUMN]
    )
      return false;

  return true;
};

const nextUnsortedLine = <Segment extends ColumnTuple>(
  mappings: readonly (readonly Segment[])[],
  start: number
): number => {
  for (let lineIndex = start; lineIndex < mappings.length; lineIndex++)
    if (!isLineSorted(mappings[lineIndex])) return lineIndex;

  return mappings.length;
};

const sortLineSegments = <Segment extends ColumnTuple>(
  lineSegments: Segment[],
  owned: boolean
): Segment[] => {
  const workingCopy = owned ? lineSegments : lineSegments.slice();
  return workingCopy.sort(sortComparator);
};

export const sortComparator = <Segment extends ColumnTuple>(
  left: Segment,
  right: Segment
): number => left[COLUMN] - right[COLUMN];

export const maybeSortMappings = <Segment extends ColumnTuple>(
  mappings: Segment[][],
  owned: boolean
): Segment[][] => {
  const firstUnsorted = nextUnsortedLine(mappings, 0);
  if (firstUnsorted === mappings.length) return mappings;

  const target = owned ? mappings : mappings.slice();

  for (
    let lineIndex = firstUnsorted;
    lineIndex < target.length;
    lineIndex = nextUnsortedLine(target, lineIndex + 1)
  )
    target[lineIndex] = sortLineSegments(target[lineIndex], owned);

  return target;
};
