import type { FixtureRun } from '../../../src/@types/tests.ts';
import { paths } from '../paths.ts';

const raw = (run: FixtureRun): string => run.stdout;

const read = (run: FixtureRun): string => paths.normalizeTeamcity(raw(run));

export const teamcity = {
  read,
  raw,
} as const;
