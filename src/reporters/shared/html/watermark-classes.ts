import type { HtmlWatermarkClasses } from '../../../@types/html.js';
import type { RowMetrics } from '../../../@types/text.js';
import type { Watermarks } from '../../../@types/watermarks.js';
import { metricReportClass } from './templates.js';

export const computeWatermarkClasses = (
  resolvedWatermarks: Watermarks,
  metrics: RowMetrics
): HtmlWatermarkClasses => ({
  statements: metricReportClass(
    resolvedWatermarks,
    metrics.statements,
    'statements'
  ),
  branches: metricReportClass(resolvedWatermarks, metrics.branches, 'branches'),
  functions: metricReportClass(
    resolvedWatermarks,
    metrics.functions,
    'functions'
  ),
  lines: metricReportClass(resolvedWatermarks, metrics.lines, 'lines'),
});
