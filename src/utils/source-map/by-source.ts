/*
 * Adapted from @jridgewell/trace-mapping's `by-source.ts`.
 * Original: https://github.com/jridgewell/sourcemaps
 * Copyright 2024 Justin Ridgewell
 * MIT License
 */

import type {
  ReverseSegment,
  ReverseSourceTable,
  SourceMapSegment,
} from '../../@types/source-map.js';
import {
  COLUMN,
  SOURCE_COLUMN,
  SOURCE_LINE,
  SOURCES_INDEX,
} from './segment.js';
import { sortComparator } from './sort.js';

const padLineSlot = (
  table: ReverseSegment[][],
  targetIndex: number
): ReverseSegment[] => {
  for (let padIndex = table.length; padIndex <= targetIndex; padIndex++)
    table[padIndex] = [];
  return table[targetIndex];
};

export const buildBySources = (
  decoded: readonly SourceMapSegment[][],
  sourceCount: number
): ReverseSourceTable[] => {
  const tables: ReverseSourceTable[] = [];
  for (let tableIndex = 0; tableIndex < sourceCount; tableIndex++)
    tables.push({ lines: [] });

  for (let lineIndex = 0; lineIndex < decoded.length; lineIndex++) {
    const lineSegments = decoded[lineIndex];

    for (
      let segmentIndex = 0;
      segmentIndex < lineSegments.length;
      segmentIndex++
    ) {
      const segment = lineSegments[segmentIndex];
      if (segment.length === 1) continue;

      const sourceIndex = segment[SOURCES_INDEX];
      const sourceLine = segment[SOURCE_LINE];
      const sourceColumn = segment[SOURCE_COLUMN];
      const generatedColumn = segment[COLUMN];
      const reverseTable = tables[sourceIndex];
      const reverseLine = padLineSlot(reverseTable.lines, sourceLine);
      const reverseSegment: ReverseSegment = [
        sourceColumn,
        0,
        lineIndex,
        generatedColumn,
      ];

      reverseLine.push(reverseSegment);
    }
  }

  for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
    const { lines } = tables[tableIndex];

    for (
      let reverseLineIndex = 0;
      reverseLineIndex < lines.length;
      reverseLineIndex++
    ) {
      const reverseLine = lines[reverseLineIndex];
      if (reverseLine.length > 0) reverseLine.sort(sortComparator);
    }
  }

  return tables;
};
