export type LineColumn = {
  line: number;
  column: number;
};

export type OffsetTableHandler = {
  lineStarts: (source: string) => number[];
  rangeLines: (
    startByte: number,
    endByte: number,
    lineStarts: number[]
  ) => [number, number];
  toLocation: (offset: number, lineStarts: number[]) => LineColumn;
  toOffset: (location: LineColumn, lineStarts: number[]) => number;
};
