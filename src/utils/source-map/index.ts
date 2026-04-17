/*
 * Adapted from @jridgewell/trace-mapping's `trace-mapping.ts`.
 * Original: https://github.com/jridgewell/sourcemaps
 * Copyright 2024 Justin Ridgewell
 * MIT License
 */

import type {
  Bias,
  ColumnTuple,
  DecodedSourceMap,
  EncodedSourceMap,
  GeneratedMapping,
  InvalidGeneratedMapping,
  InvalidOriginalMapping,
  Needle,
  OriginalMapping,
  ReverseSegment,
  ReverseSourceTable,
  SearchMemo,
  SourceMapInput,
  SourceMapSegment,
  SourceNeedle,
  TraceMap,
  TraceMapHandler,
} from '../../@types/source-map.js';
import { buildBySources } from './by-source.js';
import { createSourceResolver } from './resolve.js';
import {
  createSearchMemo,
  lowerBound,
  memoizedBinarySearchSegments,
  upperBound,
} from './search.js';
import {
  NAMES_INDEX,
  REV_GENERATED_COLUMN,
  REV_GENERATED_LINE,
  SOURCE_COLUMN,
  SOURCE_LINE,
  SOURCES_INDEX,
} from './segment.js';
import { maybeSortMappings } from './sort.js';
import { decodeMappings } from './vlq.js';

const GREATEST_LOWER_BOUND = 1 satisfies 1;
const LEAST_UPPER_BOUND = -1 satisfies -1;

const LINE_MUST_BE_POSITIVE =
  '`line` must be greater than 0 (lines start at line 1)';
const COLUMN_MUST_BE_NON_NEGATIVE =
  '`column` must be greater than or equal to 0 (columns start at column 0)';

const INVALID_ORIGINAL: InvalidOriginalMapping = {
  source: null,
  line: null,
  column: null,
  name: null,
};

const INVALID_GENERATED: InvalidGeneratedMapping = {
  line: null,
  column: null,
};

const traceSegment = <Segment extends ColumnTuple>(
  lines: readonly (readonly Segment[])[],
  searchMemo: SearchMemo,
  lineIndex: number,
  column: number,
  lookupBias: Bias
): Segment | null => {
  const segments = lineIndex < lines.length ? lines[lineIndex] : [];
  let index = memoizedBinarySearchSegments(
    segments,
    column,
    searchMemo,
    lineIndex
  );

  if (searchMemo.lastFound) {
    index =
      lookupBias === LEAST_UPPER_BOUND
        ? upperBound(segments, column, index)
        : lowerBound(segments, column, index);
    return segments[index];
  }

  if (lookupBias === LEAST_UPPER_BOUND) {
    index++;
    return index === segments.length ? null : segments[index];
  }

  return index === -1 ? null : segments[index];
};

const parseInput = (
  input: SourceMapInput
): EncodedSourceMap | DecodedSourceMap => {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;

  if (typeof raw !== 'object' || raw === null)
    throw new Error('Invalid source map: expected an object');

  if ('sections' in raw)
    throw new Error(
      'Sectioned source maps are not supported by @pokujs/coverage. ' +
        'Re-emit your bundler output as a flat source map.'
    );

  return raw as EncodedSourceMap | DecodedSourceMap;
};

const create = (input: SourceMapInput, mapUrl?: string | null): TraceMap => {
  const parsed = parseInput(input);
  const ownedMappings = typeof input === 'string';

  const rawMappings = parsed.mappings;
  let decodedMappings: SourceMapSegment[][];

  if (typeof rawMappings === 'string') {
    decodedMappings = maybeSortMappings(decodeMappings(rawMappings), true);
  } else if (Array.isArray(rawMappings)) {
    decodedMappings = maybeSortMappings(rawMappings, ownedMappings);
  } else {
    throw new Error('Invalid source map: missing or malformed mappings field');
  }

  const mapFile = parsed.file;
  const sourceRoot = parsed.sourceRoot;
  const sources = parsed.sources;
  const sourcesContent = parsed.sourcesContent;
  const names = parsed.names ?? [];

  const resolveSource = createSourceResolver(mapUrl, sourceRoot);
  const resolvedSources = sources.map(resolveSource);

  const forwardMemo = createSearchMemo();
  let bySources: ReverseSourceTable[] | undefined;
  let bySourceMemos: SearchMemo[] | undefined;

  const ensureBySources = (): {
    tables: ReverseSourceTable[];
    memos: SearchMemo[];
  } => {
    if (bySources === undefined || bySourceMemos === undefined) {
      bySources = buildBySources(decodedMappings, sources.length);
      bySourceMemos = sources.map(() => createSearchMemo());
    }
    return { tables: bySources, memos: bySourceMemos };
  };

  const findSourceIndex = (source: string): number => {
    let index = sources.indexOf(source);
    if (index === -1) index = resolvedSources.indexOf(source);
    return index;
  };

  const originalPositionFor = (
    needle: Needle
  ): OriginalMapping | InvalidOriginalMapping => {
    const lineNumber = needle.line;
    const column = needle.column;
    if (lineNumber <= 0) throw new Error(LINE_MUST_BE_POSITIVE);
    if (column < 0) throw new Error(COLUMN_MUST_BE_NON_NEGATIVE);

    const lookupBias = needle.bias ?? GREATEST_LOWER_BOUND;
    const segment = traceSegment(
      decodedMappings,
      forwardMemo,
      lineNumber - 1,
      column,
      lookupBias
    );

    if (segment === null || segment.length === 1) return INVALID_ORIGINAL;

    return {
      source: resolvedSources[segment[SOURCES_INDEX]],
      line: segment[SOURCE_LINE] + 1,
      column: segment[SOURCE_COLUMN],
      name: segment.length === 5 ? names[segment[NAMES_INDEX]] : null,
    };
  };

  const generatedPositionFor = (
    needle: SourceNeedle
  ): GeneratedMapping | InvalidGeneratedMapping => {
    const source = needle.source;
    const lineNumber = needle.line;
    const column = needle.column;
    if (lineNumber <= 0) throw new Error(LINE_MUST_BE_POSITIVE);
    if (column < 0) throw new Error(COLUMN_MUST_BE_NON_NEGATIVE);

    const sourceIndex = findSourceIndex(source);
    if (sourceIndex === -1) return INVALID_GENERATED;

    const { tables, memos } = ensureBySources();
    const lookupBias = needle.bias ?? GREATEST_LOWER_BOUND;

    const segment = traceSegment<ReverseSegment>(
      tables[sourceIndex].lines,
      memos[sourceIndex],
      lineNumber - 1,
      column,
      lookupBias
    );

    if (segment === null) return INVALID_GENERATED;

    return {
      line: segment[REV_GENERATED_LINE] + 1,
      column: segment[REV_GENERATED_COLUMN],
    };
  };

  return {
    version: 3 satisfies 3,
    file: mapFile,
    names,
    sourceRoot,
    sources,
    sourcesContent,
    resolvedSources,
    originalPositionFor,
    generatedPositionFor,
  };
};

export const traceMap: TraceMapHandler = {
  create,
  GREATEST_LOWER_BOUND,
  LEAST_UPPER_BOUND,
};
