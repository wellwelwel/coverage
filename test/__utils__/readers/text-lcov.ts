import type { FixtureRun } from '../../../src/@types/tests.ts';
import { lcovShared } from './shared/lcov.ts';

const raw = (run: FixtureRun): string => run.stdout;

const read = async (run: FixtureRun): Promise<string> => {
  const parsed = await lcovShared.parse(raw(run));

  return lcovShared.formatParsed(parsed, run.fixtureRoot);
};

export const textLcov = {
  read,
  raw,
} as const;
