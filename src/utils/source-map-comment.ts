/*
 * Adapted from convert-source-map: https://github.com/thlorenz/convert-source-map
 * Copyright 2013 Thorsten Lorenz
 * MIT License
 */

import type {
  ReadMapFunction,
  SourceMapCommentHandler,
  SourceMapDocument,
} from '../@types/source-map.js';

const commentRegex = (): RegExp =>
  /^\s*?\/[/*][@#]\s+?sourceMappingURL=data:(((?:application|text)\/json)(?:;charset=([^;,]+?)?)?)?(?:;(base64))?,(.*?)$/gm;

const mapFileCommentRegex = (): RegExp =>
  /(?:\/\/[@#][ \t]+?sourceMappingURL=([^\s'"`]+?)[ \t]*?$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*?(?:\*\/){1}[ \t]*?$)/gm;

const decodeBase64ToString = (base64: string): string =>
  Buffer.from(base64, 'base64').toString('utf8');

const extractDataPortion = (inlineComment: string): string => {
  const parts = inlineComment.split(',');
  return parts.at(-1)!;
};

const parseInlineComment = (inlineComment: string): SourceMapDocument => {
  const normalized = inlineComment
    .replace(/^\/\*/g, '//')
    .replace(/\*\/$/g, '');

  const match = commentRegex().exec(normalized);
  const encoding = (match && match[4]) || 'uri';

  let encodedPayload = extractDataPortion(normalized);
  if (encoding === 'base64')
    encodedPayload = decodeBase64ToString(encodedPayload);
  else encodedPayload = decodeURIComponent(encodedPayload);

  return JSON.parse(encodedPayload) as SourceMapDocument;
};

const parseMapFileComment = (
  fileComment: string,
  readMap: ReadMapFunction
): SourceMapDocument => {
  const match = mapFileCommentRegex().exec(fileComment);
  if (!match)
    throw new Error(
      'sourceMappingURL comment does not reference an external file'
    );

  const filename = match[1] || match[2];

  let rawMap: string;
  try {
    rawMap = readMap(filename);
  } catch (readError) {
    throw new Error(`Failed to read source map file at ${filename}`, {
      cause: readError,
    });
  }

  return JSON.parse(rawMap) as SourceMapDocument;
};

const findLastInlineComment = (content: string): SourceMapDocument | null => {
  const matches = content.match(commentRegex());
  if (!matches || matches.length === 0) return null;

  return parseInlineComment(matches.at(-1)!);
};

const findLastFileComment = (
  content: string,
  readMap: ReadMapFunction
): SourceMapDocument | null => {
  const matches = content.match(mapFileCommentRegex());

  if (!matches || matches.length === 0) return null;
  return parseMapFileComment(matches.at(-1)!, readMap);
};

const removeInlineComments = (source: string): string =>
  source.replace(commentRegex(), '');

const removeFileComments = (source: string): string =>
  source.replace(mapFileCommentRegex(), '');

export const sourceMapComment: SourceMapCommentHandler = {
  commentRegex,
  mapFileCommentRegex,
  fromComment: parseInlineComment,
  fromMapFileComment: parseMapFileComment,
  fromSource: findLastInlineComment,
  fromMapFileSource: findLastFileComment,
  removeComments: removeInlineComments,
  removeMapFileComments: removeFileComments,
};
