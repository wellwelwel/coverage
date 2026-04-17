import type {
  DecoderState,
  SourceMapSegment,
} from '../../@types/source-map.js';

const BASE64_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const CHAR_TO_INT = new Int8Array(128).fill(-1);

for (let charsetIndex = 0; charsetIndex < BASE64_CHARSET.length; charsetIndex++)
  CHAR_TO_INT[BASE64_CHARSET.charCodeAt(charsetIndex)] = charsetIndex;

const COMMA_CODE = 44;
const SEMICOLON_CODE = 59;
const CONTINUATION_BIT = 32;
const PAYLOAD_MASK = 31;

const decodeSignedNumber = (
  mappings: string,
  decoderState: DecoderState
): number => {
  let accumulator = 0;
  let shift = 0;
  let groupByte: number;

  do {
    const charCode = mappings.charCodeAt(decoderState.position++);

    groupByte = CHAR_TO_INT[charCode];
    if (groupByte === -1)
      throw new Error(
        `Invalid base64 character "${mappings[decoderState.position - 1]}" at offset ${decoderState.position - 1} in source-map mappings`
      );

    accumulator |= (groupByte & PAYLOAD_MASK) << shift;
    shift += 5;
  } while (groupByte & CONTINUATION_BIT);

  const negative = accumulator & 1;
  const magnitude = accumulator >>> 1;

  return negative ? -magnitude : magnitude;
};

const isSegmentBoundary = (charCode: number): boolean =>
  charCode === COMMA_CODE || charCode === SEMICOLON_CODE;

export const decodeMappings = (mappings: string): SourceMapSegment[][] => {
  const lines: SourceMapSegment[][] = [];
  let currentLine: SourceMapSegment[] = [];

  let generatedColumn = 0;
  let sourcesIndex = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  let namesIndex = 0;

  const decoderState: DecoderState = { position: 0 };
  const length = mappings.length;

  while (decoderState.position < length) {
    const charCode = mappings.charCodeAt(decoderState.position);

    if (charCode === COMMA_CODE) {
      decoderState.position++;
      continue;
    }

    if (charCode === SEMICOLON_CODE) {
      lines.push(currentLine);
      currentLine = [];
      generatedColumn = 0;
      decoderState.position++;
      continue;
    }

    generatedColumn += decodeSignedNumber(mappings, decoderState);

    if (
      decoderState.position >= length ||
      isSegmentBoundary(mappings.charCodeAt(decoderState.position))
    ) {
      currentLine.push([generatedColumn]);
      continue;
    }

    sourcesIndex += decodeSignedNumber(mappings, decoderState);
    sourceLine += decodeSignedNumber(mappings, decoderState);
    sourceColumn += decodeSignedNumber(mappings, decoderState);

    if (
      decoderState.position >= length ||
      isSegmentBoundary(mappings.charCodeAt(decoderState.position))
    ) {
      currentLine.push([
        generatedColumn,
        sourcesIndex,
        sourceLine,
        sourceColumn,
      ]);
      continue;
    }

    namesIndex += decodeSignedNumber(mappings, decoderState);
    currentLine.push([
      generatedColumn,
      sourcesIndex,
      sourceLine,
      sourceColumn,
      namesIndex,
    ]);
  }

  lines.push(currentLine);
  return lines;
};
