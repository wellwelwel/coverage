import type { BranchArmPosition } from '../../@types/branch-discovery.js';
import type {
  TruncatedUncovered,
  UncoveredEntry,
  UncoveredRange,
} from '../../@types/text.js';

const UNCOVERED_DISPLAY_BUDGET = 10;
const RANGE_COST = 2;
const LINE_COST = 1;

export const TRUNCATION_SUFFIX = '...';

export const truncateUncovered = (
  entries: UncoveredEntry[]
): TruncatedUncovered => {
  const visible: UncoveredEntry[] = [];

  let remaining = UNCOVERED_DISPLAY_BUDGET;

  for (const entry of entries) {
    const cost =
      entry.kind === 'range' && entry.range.start === entry.range.end
        ? LINE_COST
        : RANGE_COST;
    if (cost > remaining) return { visible, truncated: true };

    visible.push(entry);
    remaining -= cost;
  }

  return { visible, truncated: false };
};

export const extractUncoveredLines = (
  lineHits: Map<number, number>
): number[] => {
  const uncovered: number[] = [];

  for (const [lineNumber, hits] of lineHits)
    if (hits === 0) uncovered.push(lineNumber);

  return uncovered.sort((left, right) => left - right);
};

export const collapseRanges = (lines: number[]): UncoveredRange[] => {
  if (lines.length === 0) return [];

  const sorted = [...lines].sort((left, right) => left - right);
  const ranges: UncoveredRange[] = [];

  let start = sorted[0];
  let previous = start;

  for (let index = 1; index < sorted.length; index++) {
    const current = sorted[index];

    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push({ start, end: previous });

    start = current;
    previous = current;
  }

  ranges.push({ start, end: previous });
  return ranges;
};

export const formatRange = (range: UncoveredRange): string =>
  range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`;

export const formatArmPosition = (position: BranchArmPosition): string => {
  if (position.endLine === position.line)
    return `${position.line}:${position.column}-${position.endColumn}`;
  return `${position.line}:${position.column}-${position.endLine}:${position.endColumn}`;
};

export const formatUncoveredEntry = (entry: UncoveredEntry): string =>
  entry.kind === 'range'
    ? formatRange(entry.range)
    : formatArmPosition(entry.position);
