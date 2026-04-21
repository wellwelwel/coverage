import type { UrlBuilder } from '../../@types/ide.js';
import type { Runtime } from '../../@types/reporters.js';
import type {
  ColorName,
  Column,
  RenderCell,
  Row,
  RowMetrics,
  UncoveredEntry,
} from '../../@types/text.js';
import type { CoverageModel } from '../../@types/tree.js';
import type { Watermarks } from '../../@types/watermarks.js';
import { hyperlink } from '../../utils/terminal.js';
import { colorForPct, colorize } from '../shared/color.js';
import {
  aggregateLines,
  aggregateMetric,
  formatPct,
  pctValue,
  resolveDisplayPct,
} from '../shared/metrics.js';
import { shouldHideFileRow } from '../shared/skip.js';
import {
  formatArmPosition,
  formatRange,
  formatUncoveredEntry,
  truncateUncovered,
  TRUNCATION_SUFFIX,
} from './ranges.js';
import { buildTree, walkTree } from './tree.js';

const isFileRowHidden = (
  row: Row,
  skipFull: boolean,
  skipEmpty: boolean
): boolean => {
  if (!row.absolutePath || !row.metrics) return false;
  return shouldHideFileRow(row.metrics, skipFull, skipEmpty);
};

const BOX = {
  topLeft: '┌',
  topMid: '┬',
  topRight: '┐',
  midLeft: '├',
  midCross: '┼',
  midRight: '┤',
  botLeft: '└',
  botMid: '┴',
  botRight: '┘',
  vert: '│',
  horiz: '─',
};

const horizontalLine = (
  widths: number[],
  left: string,
  middle: string,
  right: string
): string => {
  const parts = widths.map((columnWidth) => BOX.horiz.repeat(columnWidth + 2));
  return colorize(left + parts.join(middle) + right, 'dimGray');
};

const dataRow = (
  cells: RenderCell[],
  widths: number[],
  columns: Column[]
): string => {
  const parts: string[] = [];
  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const renderCell = cells[cellIndex];
    const width = widths[cellIndex];
    const align = columns[cellIndex].align;
    const visible = renderCell.display ?? renderCell.text;

    let padded: string;

    if (renderCell.text.length >= width) {
      padded = visible;
    } else {
      const padding = ' '.repeat(width - renderCell.text.length);
      padded = align === 'left' ? visible + padding : padding + visible;
    }

    parts.push(renderCell.color ? colorize(padded, renderCell.color) : padded);
  }

  const separator = colorize(BOX.vert, 'dimGray');
  return separator + ' ' + parts.join(' ' + separator + ' ') + ' ' + separator;
};

const buildUncoveredDisplay = (
  entries: UncoveredEntry[],
  absolutePath: string,
  urlBuilder: UrlBuilder,
  truncated: boolean
): string => {
  const rendered = entries
    .map((entry) =>
      entry.kind === 'range'
        ? hyperlink(
            formatRange(entry.range),
            absolutePath,
            entry.range.start,
            1,
            urlBuilder
          )
        : hyperlink(
            formatArmPosition(entry.position),
            absolutePath,
            entry.position.line,
            entry.position.column,
            urlBuilder
          )
    )
    .join(', ');

  if (!truncated) return rendered;
  return rendered.length > 0
    ? `${rendered}, ${TRUNCATION_SUFFIX}`
    : TRUNCATION_SUFFIX;
};

const averageColor = (
  resolvedWatermarks: Watermarks,
  metrics: RowMetrics | null
): ColorName | null => {
  if (!metrics) return null;

  const percentages: number[] = [];

  for (const metric of [
    metrics.statements,
    metrics.branches,
    metrics.functions,
    metrics.lines,
  ]) {
    const percentage = pctValue(metric);
    if (percentage !== null) percentages.push(percentage);
  }

  if (percentages.length === 0)
    return colorForPct(resolvedWatermarks, 'lines', null);

  const average =
    percentages.reduce((sum, percentage) => sum + percentage, 0) /
    percentages.length;

  return colorForPct(resolvedWatermarks, 'lines', average);
};

const nameCell = (
  resolvedWatermarks: Watermarks,
  name: string,
  metrics: RowMetrics | null
): RenderCell => {
  const segmentColor = averageColor(resolvedWatermarks, metrics);
  const connectorIndex = Math.max(
    name.lastIndexOf('├ '),
    name.lastIndexOf('└ ')
  );

  if (connectorIndex < 0) {
    if (!segmentColor) return { text: name, color: null };
    return { text: name, color: null, display: colorize(name, segmentColor) };
  }

  const prefix = name.slice(0, connectorIndex + 2);
  const segment = name.slice(connectorIndex + 2);
  const display =
    colorize(prefix, 'dim') +
    (segmentColor ? colorize(segment, segmentColor) : segment);

  return { text: name, color: null, display };
};

const buildRowCells = (
  resolvedWatermarks: Watermarks,
  row: Row,
  urlBuilder: UrlBuilder | null,
  runtime: Runtime
): RenderCell[] => {
  if (!row.metrics) {
    return [
      nameCell(resolvedWatermarks, row.name, null),
      { text: '', color: null },
      { text: '', color: null },
      { text: '', color: null },
      { text: '', color: null },
      { text: '', color: null },
    ];
  }

  const entries: UncoveredEntry[] = [
    ...row.metrics.uncoveredRanges.map(
      (range) => ({ kind: 'range', range }) as const
    ),
    ...row.metrics.uncoveredBranchPositions.map(
      (position) => ({ kind: 'branch', position }) as const
    ),
  ];

  const { visible, truncated } = truncateUncovered(entries);

  const baseText = visible.map(formatUncoveredEntry).join(', ');

  const uncoveredText = truncated
    ? baseText.length > 0
      ? `${baseText}, ${TRUNCATION_SUFFIX}`
      : TRUNCATION_SUFFIX
    : baseText;

  const uncoveredDisplay =
    urlBuilder && uncoveredText.length > 0 && row.absolutePath
      ? buildUncoveredDisplay(visible, row.absolutePath, urlBuilder, truncated)
      : undefined;

  const uncoveredCell: RenderCell = {
    text: uncoveredText,
    color: uncoveredText.length > 0 ? 'red' : null,
    display: uncoveredDisplay,
  };

  const statementsPct = resolveDisplayPct(
    row.metrics.statements,
    runtime,
    'statements'
  );

  const branchesPct = resolveDisplayPct(
    row.metrics.branches,
    runtime,
    'branches'
  );

  const functionsPct = resolveDisplayPct(
    row.metrics.functions,
    runtime,
    'functions'
  );

  const linesPct = resolveDisplayPct(row.metrics.lines, runtime, 'lines');

  return [
    nameCell(resolvedWatermarks, row.name, row.metrics),
    {
      text: formatPct(statementsPct),
      color: colorForPct(resolvedWatermarks, 'statements', statementsPct),
    },
    {
      text: formatPct(branchesPct),
      color: colorForPct(resolvedWatermarks, 'branches', branchesPct),
    },
    {
      text: formatPct(functionsPct),
      color: colorForPct(resolvedWatermarks, 'functions', functionsPct),
    },
    {
      text: formatPct(linesPct),
      color: colorForPct(resolvedWatermarks, 'lines', linesPct),
    },
    uncoveredCell,
  ];
};

export const renderTable = (
  model: CoverageModel,
  cwd: string,
  urlBuilder: UrlBuilder | null,
  resolvedWatermarks: Watermarks,
  runtime: Runtime,
  skipFull: boolean,
  skipEmpty: boolean
): string => {
  if (model.length === 0) return '';

  const columns: Column[] = [
    { header: 'Name', align: 'left' },
    { header: 'Statements', align: 'right' },
    { header: 'Branches', align: 'right' },
    { header: 'Functions', align: 'right' },
    { header: 'Lines', align: 'right' },
    { header: 'Uncovered Lines', align: 'left' },
  ];

  const coverageTree = buildTree(model, cwd);
  const walkedRows: Row[] = [];

  walkTree(coverageTree, '', 0, walkedRows);

  const tableRows =
    skipFull || skipEmpty
      ? walkedRows.filter((row) => !isFileRowHidden(row, skipFull, skipEmpty))
      : walkedRows;

  if (tableRows.length === 0) return '';

  const aggregatedBranches = aggregateMetric(model, (file) => file.branches);
  const aggregatedFunctions = aggregateMetric(model, (file) => file.functions);
  const aggregatedLines = aggregateLines(model);

  const summaryRow: Row = {
    name: 'Summary',
    metrics: {
      statements: aggregatedLines,
      branches: aggregatedBranches,
      functions: aggregatedFunctions,
      lines: aggregatedLines,
      uncoveredRanges: [],
      uncoveredBranchPositions: [],
    },
  };

  const rowCells: RenderCell[][] = tableRows.map((row) =>
    buildRowCells(resolvedWatermarks, row, urlBuilder, runtime)
  );

  const summaryCells = buildRowCells(
    resolvedWatermarks,
    summaryRow,
    urlBuilder,
    runtime
  );

  const widths = columns.map((column, columnIndex) => {
    let columnWidth = column.header.length;

    for (const cells of rowCells) {
      const length = cells[columnIndex].text.length;
      if (length > columnWidth) columnWidth = length;
    }

    const summaryLength = summaryCells[columnIndex].text.length;
    if (summaryLength > columnWidth) columnWidth = summaryLength;

    return columnWidth;
  });

  const lines: string[] = [];

  lines.push(horizontalLine(widths, BOX.topLeft, BOX.topMid, BOX.topRight));

  const headerCells: RenderCell[] = columns.map((column) => ({
    text: column.header,
    color: 'dim',
  }));

  lines.push(dataRow(headerCells, widths, columns));
  lines.push(horizontalLine(widths, BOX.midLeft, BOX.midCross, BOX.midRight));

  for (const cells of rowCells) lines.push(dataRow(cells, widths, columns));

  lines.push(horizontalLine(widths, BOX.midLeft, BOX.midCross, BOX.midRight));
  lines.push(dataRow(summaryCells, widths, columns));
  lines.push(horizontalLine(widths, BOX.botLeft, BOX.botMid, BOX.botRight));

  return lines.join('\n');
};
