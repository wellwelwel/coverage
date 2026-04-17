/*
 * Adapted from v8-to-istanbul's `v8-to-istanbul.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { ResolvedFileFilter } from '../../@types/file-filter.js';
import type {
  BranchCounts,
  BranchMap,
  CovBranch,
  CoverageMap,
  CovFunction,
  CovLine,
  CovSource,
  FileCoverage,
  FnMap,
  FunctionCounts,
  StatementCounts,
  StatementMap,
} from '../../@types/istanbul.js';
import type { SourceMapInput } from '../../@types/source-map.js';
import type {
  ResolvedScriptSource,
  V8Function,
  V8ScriptCoverage,
} from '../../@types/v8.js';
import { readFileSync } from 'node:fs';
import { traceMap } from '../../utils/source-map/index.js';
import { passesPreRemapFilter } from '../shared/pre-remap-filter.js';
import { sourceMapRemap } from '../shared/remap.js';
import { sourceCache } from '../shared/source-cache.js';
import { findV8JsonFiles, parseV8Json } from '../shared/v8-discovery.js';
import { covBranchToBranchMapEntry, createCovBranch } from './branch.js';
import { covFunctionToFnMapEntry, createCovFunction } from './function.js';
import { covLineToStatementMapEntry } from './line.js';
import { sliceRange } from './range.js';
import { createCovSource } from './source.js';

const cloneCovSource = (baseSource: CovSource): CovSource => ({
  lines: baseSource.lines.map((covLine): CovLine => ({ ...covLine, count: 0 })),
  eof: baseSource.eof,
  shebangLength: baseSource.shebangLength,
  wrapperLength: baseSource.wrapperLength,
});

const comparePositions = (
  leftLine: number,
  leftColumn: number,
  rightLine: number,
  rightColumn: number
): number => {
  if (leftLine !== rightLine) return leftLine - rightLine;
  return leftColumn - rightColumn;
};

const applyScript = (
  covSource: CovSource,
  branches: CovBranch[],
  functions: CovFunction[],
  script: V8Function[]
): void => {
  for (const block of script) {
    for (let rangeIndex = 0; rangeIndex < block.ranges.length; rangeIndex++) {
      const range = block.ranges[rangeIndex];
      const rangeStart = range.startOffset;
      const rangeEnd = range.endOffset;

      if (rangeEnd <= rangeStart) continue;

      const affectedLines = sliceRange(covSource.lines, rangeStart, rangeEnd);
      if (affectedLines.length === 0) continue;

      const firstLine = affectedLines[0];
      const lastLine = affectedLines.at(-1)!;

      if (block.isBlockCoverage) {
        const isModuleScopeRange =
          block.functionName === '' &&
          rangeStart === 0 &&
          rangeEnd >= covSource.eof;

        if (!firstLine.ignore && !isModuleScopeRange) {
          branches.push(
            createCovBranch(
              firstLine.line,
              rangeStart - firstLine.startColumn,
              lastLine.line,
              rangeEnd - lastLine.startColumn,
              range.count
            )
          );
        }

        if (block.functionName && rangeIndex === 0) {
          functions.push(
            createCovFunction(
              block.functionName,
              firstLine.line,
              rangeStart - firstLine.startColumn,
              lastLine.line,
              rangeEnd - lastLine.startColumn,
              range.count
            )
          );
        }
      } else if (block.functionName) {
        functions.push(
          createCovFunction(
            block.functionName,
            firstLine.line,
            rangeStart - firstLine.startColumn,
            lastLine.line,
            rangeEnd - lastLine.startColumn,
            range.count
          )
        );
      }

      for (const covLine of affectedLines) {
        if (
          rangeStart <= covLine.startColumn &&
          rangeEnd >= covLine.endColumn &&
          !covLine.ignore
        )
          covLine.count = range.count;
      }
    }
  }
};

const buildFileCoverage = (
  filePath: string,
  covSource: CovSource,
  branches: CovBranch[],
  functions: CovFunction[]
): FileCoverage => {
  const statementMap: StatementMap = Object.create(null);
  const s: StatementCounts = Object.create(null);

  covSource.lines.forEach((covLine, lineIndex) => {
    const key = String(lineIndex);
    statementMap[key] = covLineToStatementMapEntry(covLine);
    s[key] = covLine.ignore ? 1 : covLine.count;
  });

  const sortedFunctions = [...functions].sort((left, right) =>
    comparePositions(
      left.startLine,
      left.startColumn,
      right.startLine,
      right.startColumn
    )
  );

  const fnMap: FnMap = Object.create(null);
  const f: FunctionCounts = Object.create(null);

  sortedFunctions.forEach((covFunction, functionIndex) => {
    const key = String(functionIndex);
    fnMap[key] = covFunctionToFnMapEntry(covFunction);
    f[key] = covFunction.count;
  });

  const sortedBranches = [...branches].sort((left, right) =>
    comparePositions(
      left.startLine,
      left.startColumn,
      right.startLine,
      right.startColumn
    )
  );
  const branchMap: BranchMap = Object.create(null);
  const b: BranchCounts = Object.create(null);

  sortedBranches.forEach((covBranch, branchIndex) => {
    const key = String(branchIndex);
    branchMap[key] = covBranchToBranchMapEntry(covBranch);
    b[key] = [covBranch.count];
  });

  return {
    path: filePath,
    statementMap,
    s,
    fnMap,
    f,
    branchMap,
    b,
  };
};

const mergeFileCoverage = (
  target: FileCoverage,
  incoming: FileCoverage
): void => {
  for (const statementKey of Object.keys(incoming.s))
    target.s[statementKey] =
      (target.s[statementKey] ?? 0) + incoming.s[statementKey];

  for (const functionKey of Object.keys(incoming.f))
    target.f[functionKey] =
      (target.f[functionKey] ?? 0) + incoming.f[functionKey];

  for (const branchKey of Object.keys(incoming.b)) {
    const existing = target.b[branchKey];
    const arriving = incoming.b[branchKey];
    if (!existing) {
      target.b[branchKey] = [...arriving];
      continue;
    }
    for (let slotIndex = 0; slotIndex < arriving.length; slotIndex++)
      existing[slotIndex] = (existing[slotIndex] ?? 0) + arriving[slotIndex];
  }
};

const buildBaseSource = (
  baseSourceCache: Map<string, CovSource>,
  filePath: string,
  sourceText: string
): CovSource => {
  let baseSource = baseSourceCache.get(filePath);
  if (baseSource !== undefined) return baseSource;
  baseSource = createCovSource(sourceText, 0);
  baseSourceCache.set(filePath, baseSource);
  return baseSource;
};

const scriptToFileCoverage = (
  script: V8ScriptCoverage,
  filePath: string,
  baseSource: CovSource
): FileCoverage => {
  const covSource = cloneCovSource(baseSource);
  const branches: CovBranch[] = [];
  const functions: CovFunction[] = [];

  applyScript(covSource, branches, functions, script.functions);

  return buildFileCoverage(filePath, covSource, branches, functions);
};

const mergeOrAssign = (
  result: CoverageMap,
  filePath: string,
  fileCoverage: FileCoverage
): void => {
  const existing = result[filePath];
  if (existing === undefined) {
    result[filePath] = fileCoverage;
    return;
  }

  mergeFileCoverage(existing, fileCoverage);
};

const processDirectScript = (
  result: CoverageMap,
  baseSourceCache: Map<string, CovSource>,
  resolved: ResolvedScriptSource,
  script: V8ScriptCoverage
): void => {
  if (resolved.filePath === '') return;

  const baseSource = buildBaseSource(
    baseSourceCache,
    resolved.filePath,
    resolved.source
  );

  const fileCoverage = scriptToFileCoverage(
    script,
    resolved.filePath,
    baseSource
  );

  mergeOrAssign(result, resolved.filePath, fileCoverage);
};

const processRemappedScript = (
  result: CoverageMap,
  baseSourceCache: Map<string, CovSource>,
  resolved: ResolvedScriptSource,
  script: V8ScriptCoverage,
  cwd: string
): void => {
  const traceMapInstance = traceMap.create(
    resolved.sourceMapData as SourceMapInput,
    resolved.sourceMapUrl
  );

  const projected = sourceMapRemap.project({
    script,
    transpiledSource: resolved.source,
    traceMapInstance,
    cwd,
  });

  for (const entry of projected) {
    const baseSource = buildBaseSource(
      baseSourceCache,
      entry.originalPath,
      entry.originalSource
    );

    const fileCoverage = scriptToFileCoverage(
      entry.syntheticScript,
      entry.originalPath,
      baseSource
    );

    mergeOrAssign(result, entry.originalPath, fileCoverage);
  }
};

export const v8ToIstanbul = (
  tempDir: string,
  cwd: string,
  preRemapFilter: ResolvedFileFilter
): CoverageMap => {
  const result: CoverageMap = Object.create(null);
  const baseSourceCache = new Map<string, CovSource>();

  const jsonFiles = findV8JsonFiles(tempDir);
  if (jsonFiles.length === 0) return result;

  for (const jsonPath of jsonFiles) {
    let jsonContent: string;

    try {
      jsonContent = readFileSync(jsonPath, 'utf8');
    } catch {
      continue;
    }

    const document = parseV8Json(jsonContent);

    for (const script of document.scripts) {
      const resolved = sourceCache.resolve({
        script,
        sourceMapCache: document.sourceMapCache,
        cwd,
      });

      if (resolved === undefined) continue;

      if (!passesPreRemapFilter(script, resolved, preRemapFilter, cwd))
        continue;

      if (resolved.sourceMapData !== undefined) {
        processRemappedScript(result, baseSourceCache, resolved, script, cwd);
      } else {
        processDirectScript(result, baseSourceCache, resolved, script);
      }
    }
  }

  return result;
};
