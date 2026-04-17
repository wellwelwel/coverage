import type { ReporterName, Runtime } from './reporters.js';

export type Platform = 'darwin' | 'linux' | 'win32';

export type SnapshotExtension = 'json' | 'xml' | 'html' | 'txt';

export type FixtureRun = {
  exitCode: number;
  stdout: string;
  stderr: string;
  fixtureRoot: string;
};

export type TestCase = {
  reporter: ReporterName;
  runtime: Runtime;
  name: string;
  extension?: SnapshotExtension;
  platform?: Platform;
};

export type RuntimeSpec = {
  command: string;
  args: readonly string[];
  env?: Readonly<Record<string, string | undefined>>;
};
