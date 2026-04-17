import type { Row } from '../../@types/text.js';
import type { TreeNode } from '../../@types/tree.js';
import {
  aggregateLines,
  aggregateMetric,
  linesMetric,
} from '../shared/metrics.js';
import { collectFileCoverages } from '../shared/tree.js';
import { collapseRanges, extractUncoveredLines } from './ranges.js';

export { buildTree } from '../shared/tree.js';

export const walkTree = (
  node: TreeNode,
  prefix: string,
  depth: number,
  rows: Row[]
): void => {
  const total = node.children.length;

  for (let childIndex = 0; childIndex < total; childIndex++) {
    const child = node.children[childIndex];
    const isLast = childIndex === total - 1;

    let name: string;

    if (depth === 0) {
      name = child.segment;
    } else {
      const connector = isLast ? '└ ' : '├ ';

      name = prefix + connector + child.segment;
    }

    if (child.isFile && child.file) {
      const fileLines = linesMetric(child.file.lineHits);
      const branchPositionLines = new Set<number>();

      for (const position of child.file.uncoveredBranchPositions)
        branchPositionLines.add(position.line);

      const uncoveredLineNumbers = extractUncoveredLines(
        child.file.lineHits
      ).filter((lineNumber) => !branchPositionLines.has(lineNumber));

      rows.push({
        name,
        absolutePath: child.file.file,
        metrics: {
          statements: fileLines,
          branches: child.file.branches,
          functions: child.file.functions,
          lines: fileLines,
          uncoveredRanges: collapseRanges(uncoveredLineNumbers),
          uncoveredBranchPositions: child.file.uncoveredBranchPositions,
        },
      });
    } else {
      const descendantFiles = collectFileCoverages(child);
      const descendantLines = aggregateLines(descendantFiles);

      rows.push({
        name,
        metrics: {
          statements: descendantLines,
          branches: aggregateMetric(
            descendantFiles,
            (fileCoverage) => fileCoverage.branches
          ),
          functions: aggregateMetric(
            descendantFiles,
            (fileCoverage) => fileCoverage.functions
          ),
          lines: descendantLines,
          uncoveredRanges: [],
          uncoveredBranchPositions: [],
        },
      });
    }

    if (child.children.length > 0) {
      let nextPrefix: string;

      if (depth === 0) {
        nextPrefix = '';
      } else {
        nextPrefix = prefix + (isLast ? '  ' : '│ ');
      }

      walkTree(child, nextPrefix, depth + 1, rows);
    }
  }
};
