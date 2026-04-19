export type CheckCoverageMetric =
  | 'statements'
  | 'branches'
  | 'functions'
  | 'lines';

export type CheckCoverageThresholds = {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  perFile: boolean;
};

export type CheckCoverageFailure = {
  scope: 'total' | string;
  metric: CheckCoverageMetric;
  threshold: number;
  actual: number | null;
};

export type CheckCoverageInput = number | Partial<CheckCoverageThresholds>;
