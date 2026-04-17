/*
 * Original: https://github.com/jridgewell/sourcemaps
 * Copyright 2024 Justin Ridgewell <justin@ridgewell.name>
 * MIT License
 */

export type Bias = -1 | 1;

export type SourceMapV3 = {
  version: 3;
  file?: string | null;
  names: string[];
  sourceRoot?: string;
  sources: (string | null)[];
  sourcesContent?: (string | null)[];
  ignoreList?: number[];
};

export type EncodedSourceMap = SourceMapV3 & {
  mappings: string;
};

export type DecodedSourceMap = SourceMapV3 & {
  mappings: SourceMapSegment[][];
};

export type SourceMapSegment =
  | [number]
  | [number, number, number, number]
  | [number, number, number, number, number];

export type SourceMapInput = string | EncodedSourceMap | DecodedSourceMap;

export type Needle = {
  line: number;
  column: number;
  bias?: Bias;
};

export type SourceNeedle = {
  source: string;
  line: number;
  column: number;
  bias?: Bias;
};

export type OriginalMapping = {
  source: string;
  line: number;
  column: number;
  name: string | null;
};

export type InvalidOriginalMapping = {
  source: null;
  line: null;
  column: null;
  name: null;
};

export type GeneratedMapping = {
  line: number;
  column: number;
};

export type InvalidGeneratedMapping = {
  line: null;
  column: null;
};

export type TraceMap = {
  readonly version: 3;
  readonly file: string | null | undefined;
  readonly names: readonly string[];
  readonly sourceRoot: string | undefined;
  readonly sources: readonly (string | null)[];
  readonly sourcesContent: readonly (string | null)[] | undefined;
  readonly resolvedSources: readonly string[];
  originalPositionFor: (
    needle: Needle
  ) => OriginalMapping | InvalidOriginalMapping;
  generatedPositionFor: (
    needle: SourceNeedle
  ) => GeneratedMapping | InvalidGeneratedMapping;
};

export type TraceMapHandler = {
  create: (input: SourceMapInput, mapUrl?: string | null) => TraceMap;
  GREATEST_LOWER_BOUND: 1;
  LEAST_UPPER_BOUND: -1;
};

export type ReverseSegment = [number, 0, number, number];

export type SearchMemo = {
  lastKey: number;
  lastNeedle: number;
  lastIndex: number;
  lastFound: boolean;
};

export type ReverseSourceTable = {
  lines: ReverseSegment[][];
};

export type DecoderState = {
  position: number;
};

export type ColumnTuple = readonly [number, ...number[]];

export type SourceMapDocument = EncodedSourceMap | DecodedSourceMap;

export type ReadMapFunction = (filename: string) => string;

export type SourceMapCommentHandler = {
  commentRegex: () => RegExp;
  mapFileCommentRegex: () => RegExp;
  fromComment: (comment: string) => SourceMapDocument;
  fromMapFileComment: (
    comment: string,
    readMap: ReadMapFunction
  ) => SourceMapDocument;
  fromSource: (content: string) => SourceMapDocument | null;
  fromMapFileSource: (
    content: string,
    readMap: ReadMapFunction
  ) => SourceMapDocument | null;
  removeComments: (source: string) => string;
  removeMapFileComments: (source: string) => string;
};
