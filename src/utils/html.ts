const RE_AMP = /&/g;
const RE_LT = /</g;
const RE_GT = />/g;
const RE_QUOTE = /"/g;
const RE_APOS = /'/g;

export const htmlEscape = (value: string): string =>
  value
    .replace(RE_AMP, '&amp;')
    .replace(RE_LT, '&lt;')
    .replace(RE_GT, '&gt;')
    .replace(RE_QUOTE, '&quot;')
    .replace(RE_APOS, '&#39;');
