import type { FixtureRun } from '../../../src/@types/tests.ts';

const raw = (run: FixtureRun): string => run.stdout;

const read = (run: FixtureRun): string => raw(run).replace(/\r\n/g, '\n');

export const textLcov = {
  read,
  raw,
} as const;
