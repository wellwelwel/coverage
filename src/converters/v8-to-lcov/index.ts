import type { ResolvedFileFilter } from '../../@types/file-filter.js';
import type { SourceMapInput } from '../../@types/source-map.js';
import type {
  FileAggregation,
  ResolvedScriptSource,
  V8ScriptCoverage,
} from '../../@types/v8.js';
import { readFileSync } from 'node:fs';
import { offsets } from '../../utils/offsets.js';
import { traceMap } from '../../utils/source-map/index.js';
import { ignoreDirectives } from '../shared/ignore-directives.js';
import { passesPreRemapFilter } from '../shared/pre-remap-filter.js';
import { sourceMapRemap } from '../shared/remap.js';
import { sourceCache } from '../shared/source-cache.js';
import { findV8JsonFiles, parseV8Json } from '../shared/v8-discovery.js';
import {
  absorbFunctions,
  applyIgnoredBranches,
  applyIgnoredLines,
  computeLineHits,
  filterGhostBranches,
  mergeLineHits,
} from './extraction.js';
import { serializeLcov } from './serialize.js';

const mergeIntoAggregation = (
  aggregations: Map<string, FileAggregation>,
  filePath: string,
  source: string,
  script: V8ScriptCoverage
): void => {
  let aggregation = aggregations.get(filePath);

  if (!aggregation) {
    aggregation = {
      lineHits: new Map(),
      functions: new Map(),
    };

    aggregations.set(filePath, aggregation);
  }

  const lineStartTable = offsets.lineStarts(source);

  mergeLineHits(aggregation.lineHits, computeLineHits(source, script));
  absorbFunctions(aggregation, script, lineStartTable);
  filterGhostBranches(aggregation, source, lineStartTable);

  const ignoredLines = ignoreDirectives.parseSource(source);

  applyIgnoredLines(aggregation.lineHits, ignoredLines);
  applyIgnoredBranches(aggregation, ignoredLines);
};

const processDirectScript = (
  aggregations: Map<string, FileAggregation>,
  resolved: ResolvedScriptSource,
  script: V8ScriptCoverage
): void => {
  if (resolved.filePath === '') return;

  mergeIntoAggregation(
    aggregations,
    resolved.filePath,
    resolved.source,
    script
  );
};

const processRemappedScript = (
  aggregations: Map<string, FileAggregation>,
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
    mergeIntoAggregation(
      aggregations,
      entry.originalPath,
      entry.originalSource,
      entry.syntheticScript
    );
  }
};

export const v8ToLcov = (
  tempDir: string,
  cwd: string,
  preRemapFilter: ResolvedFileFilter
): string => {
  const jsonFiles = findV8JsonFiles(tempDir);
  if (jsonFiles.length === 0) return '';

  const fileAggregations = new Map<string, FileAggregation>();

  for (const jsonPath of jsonFiles) {
    let content: string;

    try {
      content = readFileSync(jsonPath, 'utf8');
    } catch {
      continue;
    }

    const document = parseV8Json(content);

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
        processRemappedScript(fileAggregations, resolved, script, cwd);
      } else {
        processDirectScript(fileAggregations, resolved, script);
      }
    }
  }

  return serializeLcov(fileAggregations, cwd);
};
