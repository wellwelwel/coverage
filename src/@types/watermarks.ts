export type WatermarkLevel = 'low' | 'medium' | 'high';

export type WatermarkMetric = 'statements' | 'branches' | 'functions' | 'lines';

export type Watermarks = Record<WatermarkMetric, readonly [number, number]>;

export type WatermarksHandler = {
  getDefault: () => Watermarks;
  classForPercent: (
    resolved: Watermarks,
    metric: WatermarkMetric,
    value: number | null
  ) => WatermarkLevel | null;
  normalize: (custom: Partial<Watermarks> | undefined) => Watermarks;
};
