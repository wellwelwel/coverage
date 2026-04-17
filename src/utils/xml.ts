/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

import type { XmlAttrs, XmlBuilder, XmlHandler } from '../@types/xml.js';

const INDENT = '  ';

const escapeAttr = (value: string | number): string =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const formatAttrs = (attrs: XmlAttrs | undefined): string => {
  if (!attrs) return '';
  let result = '';
  for (const [key, value] of Object.entries(attrs))
    result += ` ${key}="${escapeAttr(value)}"`;
  return result;
};

const create = (): XmlBuilder => {
  const stack: string[] = [];
  const lines: string[] = [];

  const indentFor = (text: string): string =>
    INDENT.repeat(stack.length) + text;

  const openTag: XmlBuilder['openTag'] = (name, attrs) => {
    lines.push(indentFor(`<${name}${formatAttrs(attrs)}>`));
    stack.push(name);
  };

  const closeTag: XmlBuilder['closeTag'] = (name) => {
    if (stack.length === 0)
      throw new Error(`Attempt to close tag ${name} when not opened`);
    const stashed = stack.pop();
    if (stashed !== name)
      throw new Error(
        `Attempt to close tag ${name} when ${stashed} was the one open`
      );
    lines.push(indentFor(`</${name}>`));
  };

  const inlineTag: XmlBuilder['inlineTag'] = (name, attrs, content) => {
    const body =
      content === undefined
        ? `<${name}${formatAttrs(attrs)}/>`
        : `<${name}${formatAttrs(attrs)}>${content}</${name}>`;
    lines.push(indentFor(body));
  };

  const closeAll: XmlBuilder['closeAll'] = () => {
    while (stack.length > 0) closeTag(stack.at(-1)!);
  };

  const toString = (): string => lines.join('\n');

  return { openTag, closeTag, inlineTag, closeAll, toString };
};

export const xml: XmlHandler = { create };
