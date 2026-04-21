import type { CoverageMap, FileCoverage } from './@types/istanbul.js';
import type { ReporterContext, Runtime } from './@types/reporters.js';
import { readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileFilter } from './file-filter.js';
import { relativize, toPosix } from './utils/paths.js';

const SOURCE_EXTENSIONS: readonly string[] = [
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
  '.jsx',
];

const PRUNED_DIRECTORY_NAMES: ReadonlySet<string> = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
]);

const hasSourceExtension = (fileName: string): boolean => {
  for (const extension of SOURCE_EXTENSIONS)
    if (fileName.endsWith(extension)) return true;

  return false;
};

const walkDirectory = (
  directoryPath: string,
  context: ReporterContext,
  collected: Set<string>
): void => {
  let entries;
  try {
    entries = readdirSync(directoryPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryName = entry.name;

    if (entry.isDirectory()) {
      if (PRUNED_DIRECTORY_NAMES.has(entryName)) continue;
      if (entryName.startsWith('.')) continue;

      walkDirectory(join(directoryPath, entryName), context, collected);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!hasSourceExtension(entryName)) continue;

    const absolutePath = join(directoryPath, entryName);

    if (!fileFilter.matches(context.userFilter, absolutePath, context.cwd))
      continue;

    collected.add(absolutePath);
  }
};

const resolveSrcRoots = (context: ReporterContext): readonly string[] => {
  const src = context.options.src;
  if (src === undefined) return [context.cwd];

  const list = typeof src === 'string' ? [src] : src;
  return list.map((root) =>
    isAbsolute(root) ? root : resolve(context.cwd, root)
  );
};

const discover = (context: ReporterContext): Set<string> => {
  const collected = new Set<string>();

  for (const root of resolveSrcRoots(context))
    walkDirectory(root, context, collected);

  return collected;
};

const readSourceLines = (absolutePath: string): string[] | null => {
  try {
    return readFileSync(absolutePath, 'utf8').split('\n');
  } catch {
    return null;
  }
};

const extractExistingSourceFiles = (lcov: string, cwd: string): Set<string> => {
  const paths = new Set<string>();
  const sourceFileRegex = /(?:^|\n)SF:([^\r\n]+)/g;

  let match: RegExpExecArray | null;

  while ((match = sourceFileRegex.exec(lcov)) !== null) {
    const sourcePath = match[1].trim();
    paths.add(isAbsolute(sourcePath) ? sourcePath : resolve(cwd, sourcePath));
  }
  return paths;
};

const buildZeroLcovRecord = (
  cwd: string,
  absolutePath: string,
  sourceLines: readonly string[],
  runtime: Runtime
): string => {
  const lines: string[] = [
    'TN:',
    `SF:${toPosix(relativize(absolutePath, cwd))}`,
    'FNF:0',
    'FNH:0',
  ];

  let executable = 0;

  for (let lineIndex = 0; lineIndex < sourceLines.length; lineIndex++) {
    if (sourceLines[lineIndex].trim().length === 0) continue;

    lines.push(`DA:${lineIndex + 1},0`);
    executable++;
  }

  lines.push(`LF:${executable}`, 'LH:0');
  if (runtime !== 'bun') lines.push('BRF:0', 'BRH:0');
  lines.push('end_of_record');

  return `${lines.join('\n')}\n`;
};

const injectLcov = (
  lcov: string,
  discovered: ReadonlySet<string>,
  cwd: string,
  runtime: Runtime
): string => {
  if (discovered.size === 0) return lcov;

  const existing = extractExistingSourceFiles(lcov, cwd);
  const appended: string[] = [];

  for (const absolutePath of discovered) {
    if (existing.has(absolutePath)) continue;

    const sourceLines = readSourceLines(absolutePath);
    if (sourceLines === null) continue;

    appended.push(buildZeroLcovRecord(cwd, absolutePath, sourceLines, runtime));
  }

  if (appended.length === 0) return lcov;
  return lcov + appended.join('');
};

const buildZeroFileCoverage = (
  absolutePath: string,
  sourceLines: readonly string[]
): FileCoverage => {
  const statementMap: FileCoverage['statementMap'] = Object.create(null);
  const statementCounts: FileCoverage['s'] = Object.create(null);

  let statementId = 0;

  for (let lineIndex = 0; lineIndex < sourceLines.length; lineIndex++) {
    const sourceLine = sourceLines[lineIndex];
    if (sourceLine.trim().length === 0) continue;

    const statementKey = String(statementId++);

    statementMap[statementKey] = {
      start: { line: lineIndex + 1, column: 0 },
      end: { line: lineIndex + 1, column: sourceLine.length },
    };

    statementCounts[statementKey] = 0;
  }

  return {
    path: absolutePath,
    all: true,
    statementMap,
    s: statementCounts,
    fnMap: Object.create(null),
    f: Object.create(null),
    branchMap: Object.create(null),
    b: Object.create(null),
  };
};

const injectCoverageMap = (
  coverageMap: CoverageMap,
  discovered: ReadonlySet<string>
): void => {
  for (const absolutePath of discovered) {
    if (coverageMap[absolutePath] !== undefined) continue;

    const sourceLines = readSourceLines(absolutePath);
    if (sourceLines === null) continue;

    coverageMap[absolutePath] = buildZeroFileCoverage(
      absolutePath,
      sourceLines
    );
  }
};

export const allFiles = {
  discover,
  injectLcov,
  injectCoverageMap,
} as const;
