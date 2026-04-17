import type { FileAggregation, V8ScriptCoverage } from '../../@types/v8.js';
import { offsets } from '../../utils/offsets.js';

export const computeLineHits = (
  source: string,
  script: V8ScriptCoverage
): Map<number, number> => {
  const lineCounts = new Map<number, number>();
  const lineRangeSize = new Map<number, number>();
  const lineStartTable = offsets.lineStarts(source);
  const totalLines = source.split('\n').length;

  for (const scriptFunction of script.functions) {
    for (const range of scriptFunction.ranges) {
      if (range.endOffset <= range.startOffset) continue;

      const [firstLine, lastLine] = offsets.rangeLines(
        range.startOffset,
        range.endOffset,
        lineStartTable
      );

      const size = range.endOffset - range.startOffset;

      for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber++) {
        const existing = lineRangeSize.get(lineNumber);

        if (existing === undefined || size < existing) {
          lineRangeSize.set(lineNumber, size);
          lineCounts.set(lineNumber, range.count);
        }
      }
    }
  }

  const result = new Map<number, number>();

  for (const [lineNumber, count] of lineCounts) {
    if (lineNumber < 1 || lineNumber > totalLines) continue;
    result.set(lineNumber, count);
  }

  const moduleFunction = script.functions.find(
    (scriptFunction) => scriptFunction.functionName === ''
  );
  const moduleCount = moduleFunction?.ranges[0]?.count ?? 0;

  for (let lineNumber = 1; lineNumber <= totalLines; lineNumber++) {
    if (!result.has(lineNumber)) result.set(lineNumber, moduleCount);
  }

  return result;
};

const branchTokenPattern =
  /\?|&&|\|\||\bif\b|\belse\b|\bswitch\b|\bcase\b|\bdefault\b|\bfor\b|\bwhile\b|\bdo\b|\bcatch\b/;

export const filterGhostBranches = (
  fileAggregation: FileAggregation,
  source: string,
  lineStarts: number[]
): void => {
  const sourceLength = source.length;
  const lineHasBranchToken = new Map<number, boolean>();

  const lineCarriesBranchToken = (lineNumber: number): boolean => {
    if (lineNumber < 1) return true;

    const cached = lineHasBranchToken.get(lineNumber);
    if (cached !== undefined) return cached;

    const lineStart = lineStarts[lineNumber - 1] ?? 0;
    const lineEnd = lineStarts[lineNumber] ?? sourceLength;
    const lineText = source.slice(lineStart, lineEnd);
    const carries = branchTokenPattern.test(lineText);

    lineHasBranchToken.set(lineNumber, carries);
    return carries;
  };

  for (const functionEntry of fileAggregation.functions.values()) {
    if (!functionEntry.isBlockCoverage) continue;
    if (functionEntry.subRanges.size === 0) continue;

    const ghostKeys: string[] = [];
    for (const [subKey, subRange] of functionEntry.subRanges) {
      if (!lineCarriesBranchToken(subRange.line)) {
        ghostKeys.push(subKey);
      }
    }

    for (const subKey of ghostKeys) {
      functionEntry.subRanges.delete(subKey);
    }
  }
};

export const applyIgnoredLines = (
  lineHits: Map<number, number>,
  ignoredLines: Set<number>
): void => {
  for (const ignoredLine of ignoredLines) {
    if (lineHits.has(ignoredLine)) lineHits.set(ignoredLine, 1);
  }
};

export const applyIgnoredBranches = (
  fileAggregation: FileAggregation,
  ignoredLines: Set<number>
): void => {
  if (ignoredLines.size === 0) return;

  for (const functionEntry of fileAggregation.functions.values()) {
    if (functionEntry.subRanges.size === 0) continue;

    const ignoredKeys: string[] = [];

    for (const [subKey, subRange] of functionEntry.subRanges) {
      if (ignoredLines.has(subRange.line)) ignoredKeys.push(subKey);
    }

    for (const subKey of ignoredKeys) functionEntry.subRanges.delete(subKey);
  }
};

export const mergeLineHits = (
  target: Map<number, number>,
  source: Map<number, number>
): void => {
  for (const [lineNumber, hits] of source)
    target.set(lineNumber, (target.get(lineNumber) ?? 0) + hits);
};

export const absorbFunctions = (
  fileAggregation: FileAggregation,
  script: V8ScriptCoverage,
  lineStarts: number[]
): void => {
  for (const scriptFunction of script.functions) {
    if (scriptFunction.ranges.length === 0) continue;

    const outerRange = scriptFunction.ranges[0];
    const functionKey = `${outerRange.startOffset}-${outerRange.endOffset}`;

    let functionEntry = fileAggregation.functions.get(functionKey);

    if (!functionEntry) {
      const [line] = offsets.rangeLines(
        outerRange.startOffset,
        outerRange.endOffset,
        lineStarts
      );
      functionEntry = {
        line,
        name: scriptFunction.functionName,
        outerCount: 0,
        isBlockCoverage: scriptFunction.isBlockCoverage,
        subRanges: new Map(),
      };
      fileAggregation.functions.set(functionKey, functionEntry);
    } else if (
      functionEntry.name === '' &&
      scriptFunction.functionName !== ''
    ) {
      functionEntry.name = scriptFunction.functionName;
    }

    functionEntry.outerCount += outerRange.count;

    for (
      let rangeIndex = 1;
      rangeIndex < scriptFunction.ranges.length;
      rangeIndex++
    ) {
      const subRange = scriptFunction.ranges[rangeIndex];
      const subKey = `${subRange.startOffset}-${subRange.endOffset}`;

      let subRangeEntry = functionEntry.subRanges.get(subKey);

      if (!subRangeEntry) {
        const [subLine] = offsets.rangeLines(
          subRange.startOffset,
          subRange.endOffset,
          lineStarts
        );
        subRangeEntry = {
          line: subLine,
          takenCount: 0,
          indexInFunction: rangeIndex - 1,
        };
        functionEntry.subRanges.set(subKey, subRangeEntry);
      }

      subRangeEntry.takenCount += subRange.count;
    }
  }
};
