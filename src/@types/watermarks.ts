export type WatermarkLevel = 'low' | 'medium' | 'high';

export type WatermarkMetric = 'statements' | 'branches' | 'functions' | 'lines';

export type Watermarks = Record<WatermarkMetric, readonly [number, number]>;
