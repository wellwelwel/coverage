import type { FixtureRun } from '../../../src/@types/tests.ts';
import { paths } from '../paths.ts';

const raw = (run: FixtureRun): string => run.stdout;

const read = (run: FixtureRun): string =>
  paths.normalizeText(raw(run), run.fixtureRoot);

export const text = {
  read,
  raw,
} as const;
