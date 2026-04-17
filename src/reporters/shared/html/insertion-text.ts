/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
*/

import type {
  HtmlInsertionOffset,
  HtmlInsertionText,
  HtmlInsertionTextHandler,
} from '../../../@types/html.js';

const WHITE_RE = /[ \f\n\r\t\v\u00A0\u2028\u2029]/;

const findFirstNonBlank = (text: string): number => {
  for (let charIndex = 0; charIndex < text.length; charIndex++)
    if (!WHITE_RE.test(text.charAt(charIndex))) return charIndex;

  return -1;
};

const findLastNonBlank = (text: string): number => {
  for (let charIndex = text.length - 1; charIndex >= 0; charIndex--)
    if (!WHITE_RE.test(text.charAt(charIndex))) return charIndex;

  return text.length + 1;
};

const create = (
  initialText: string,
  defaultConsumeBlanks: boolean
): HtmlInsertionText => {
  let currentText = initialText;
  const originalLength = initialText.length;
  const offsets: HtmlInsertionOffset[] = [];
  const startPosition = findFirstNonBlank(initialText);
  const endPosition = findLastNonBlank(initialText);

  const findOffset = (
    position: number,
    length: number,
    insertBefore: boolean
  ): number => {
    let cumulativeOffset = 0;
    let offsetIndex = 0;
    let matchedOffset: HtmlInsertionOffset | undefined;

    for (offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
      matchedOffset = offsets[offsetIndex];

      if (
        matchedOffset.position < position ||
        (matchedOffset.position === position && !insertBefore)
      )
        cumulativeOffset += matchedOffset.length;

      if (matchedOffset.position >= position) break;
    }

    if (matchedOffset && matchedOffset.position === position)
      matchedOffset.length += length;
    else offsets.splice(offsetIndex, 0, { position, length });

    return cumulativeOffset;
  };

  const insertAt = (
    column: number,
    insertedText: string,
    insertBefore: boolean,
    consumeBlanks?: boolean
  ): HtmlInsertionText => {
    const effectiveConsume =
      consumeBlanks === undefined ? defaultConsumeBlanks : consumeBlanks;

    let effectiveColumn = column > originalLength ? originalLength : column;
    if (effectiveColumn < 0) effectiveColumn = 0;

    if (effectiveConsume) {
      if (effectiveColumn <= startPosition) effectiveColumn = 0;
      if (effectiveColumn > endPosition) effectiveColumn = originalLength;
    }

    const insertedLength = insertedText.length;
    const offset = findOffset(effectiveColumn, insertedLength, insertBefore);
    const realPosition = effectiveColumn + offset;

    currentText =
      currentText.substring(0, realPosition) +
      insertedText +
      currentText.substring(realPosition);

    return handler;
  };

  const wrap = (
    startColumn: number,
    startText: string,
    endColumn: number,
    endText: string,
    consumeBlanks?: boolean
  ): HtmlInsertionText => {
    insertAt(startColumn, startText, true, consumeBlanks);
    insertAt(endColumn, endText, false, consumeBlanks);

    return handler;
  };

  const wrapLine = (startText: string, endText: string): void => {
    wrap(0, startText, originalLength, endText);
  };

  const handler: HtmlInsertionText = {
    insertAt,
    wrap,
    wrapLine,
    originalLength: () => originalLength,
    toString: () => currentText,
  };

  return handler;
};

export const insertionText: HtmlInsertionTextHandler = { create };
