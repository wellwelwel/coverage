export const slug = (input: string): string =>
  input.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');

export const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
