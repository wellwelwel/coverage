import type { FixtureRun } from '../../../src/@types/tests.ts';
import { paths } from '../paths.ts';

const raw = (run: FixtureRun): string => run.stdout;

const read = (run: FixtureRun): string => paths.normalizeTextSummary(raw(run));

export const textSummary = {
  read,
  raw,
} as const;
