/*
 * Adapted from v8-to-istanbul's `source.js`.
 * Original: https://github.com/istanbuljs/v8-to-istanbul
 * Copyright 2017, Contributors
 * ISC License
 */

import type { CovLine, CovSource } from '../../@types/istanbul.js';
import { ignoreDirectives, LINE_SPLIT } from '../shared/ignore-directives.js';
import { createCovLine } from './line.js';

const buildLines = (source: string): CovLine[] => {
  const ignoredLines = ignoreDirectives.parseSource(source);
  const lines: CovLine[] = [];
  const splitLines = source.split(LINE_SPLIT);

  let runningPosition = 0;

  for (let lineIndex = 0; lineIndex < splitLines.length; lineIndex++) {
    const lineText = splitLines[lineIndex];
    const covLine = createCovLine(lineIndex + 1, runningPosition, lineText);

    covLine.ignore = ignoredLines.has(lineIndex + 1);
    lines.push(covLine);

    runningPosition += lineText.length;
  }

  return lines;
};

export const createCovSource = (
  rawSource: string,
  wrapperLength: number
): CovSource => {
  const trimmed = rawSource.length > 0 ? rawSource.trimEnd() : '';

  return {
    lines: buildLines(trimmed),
    eof: trimmed.length,
    shebangLength: 0,
    wrapperLength,
  };
};
