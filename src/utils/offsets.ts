import type { LineColumn } from '../@types/offsets.js';

const lineStarts = (source: string): number[] => {
  const buffer = Buffer.from(source, 'utf8');
  const starts: number[] = [0];

  for (let byteIndex = 0; byteIndex < buffer.length; byteIndex++) {
    if (buffer[byteIndex] === 0x0a /* \n */) starts.push(byteIndex + 1);
  }

  starts.push(buffer.length);
  return starts;
};

const rangeLines = (
  startByte: number,
  endByte: number,
  lineStartTable: number[]
): [number, number] => {
  let low = 0;
  let high = lineStartTable.length - 1;

  while (low < high) {
    const middle = (low + high + 1) >>> 1;

    if (lineStartTable[middle] <= startByte) low = middle;
    else high = middle - 1;
  }

  const first = low + 1;

  low = 0;
  high = lineStartTable.length - 1;

  while (low < high) {
    const middle = (low + high + 1) >>> 1;

    if (lineStartTable[middle] < endByte) low = middle;
    else high = middle - 1;
  }

  const last = Math.max(first, low + 1);
  return [first, last];
};

const toLocation = (offset: number, lineStartTable: number[]): LineColumn => {
  let low = 0;
  let high = lineStartTable.length - 1;

  while (low < high) {
    const middle = (low + high + 1) >>> 1;
    if (lineStartTable[middle] <= offset) low = middle;
    else high = middle - 1;
  }

  return {
    line: low + 1,
    column: offset - lineStartTable[low],
  };
};

const toOffset = (location: LineColumn, lineStartTable: number[]): number => {
  const lineIndex = location.line - 1;

  if (lineIndex < 0) return 0;
  if (lineIndex >= lineStartTable.length) {
    return lineStartTable.at(-1)!;
  }

  return lineStartTable[lineIndex] + location.column;
};

export const offsets = {
  lineStarts,
  rangeLines,
  toLocation,
  toOffset,
} as const;
