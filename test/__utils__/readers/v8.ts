import { readdirSync, readFileSync } from 'node:fs';
import { paths } from '../paths.ts';

const read = (fixtureRoot: string): Map<string, string> => {
  const coverageDir = `${fixtureRoot}/coverage/v8`;
  const accumulator = new Map<string, string>();

  let entries: string[];
  try {
    entries = readdirSync(coverageDir);
  } catch {
    return accumulator;
  }

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;

    const rawContent = readFileSync(`${coverageDir}/${entry}`, 'utf8');
    const normalized = paths.normalizeV8(rawContent, fixtureRoot);
    if (normalized === null) continue;

    const parsed: { result: { url: string }[] } = JSON.parse(normalized);
    if (parsed.result.length === 0) continue;

    const userScriptUrl = parsed.result[0].url;
    const basename = userScriptUrl.split('/').pop() ?? 'script';
    const key = `coverage-${basename}.json`;

    accumulator.set(key, normalized);
  }

  return accumulator;
};

export const v8 = {
  read,
} as const;
