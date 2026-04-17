/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

import type { Metric } from '../../@types/text.js';
import type { XmlAttrs } from '../../@types/xml.js';
import { metricCovered, metricTotal } from '../shared/metrics.js';

export const baseMetrics = (
  lines: Metric,
  branches: Metric,
  functions: Metric
): XmlAttrs => ({
  statements: metricTotal(lines),
  coveredstatements: metricCovered(lines),
  conditionals: metricTotal(branches),
  coveredconditionals: metricCovered(branches),
  methods: metricTotal(functions),
  coveredmethods: metricCovered(functions),
});

export const rootMetrics = (
  lines: Metric,
  branches: Metric,
  functions: Metric,
  packages: number,
  files: number
): XmlAttrs => {
  const linesTotal = metricTotal(lines);
  const elements = linesTotal + metricTotal(branches) + metricTotal(functions);
  const coveredElements =
    metricCovered(lines) + metricCovered(branches) + metricCovered(functions);
  return {
    ...baseMetrics(lines, branches, functions),
    elements,
    coveredelements: coveredElements,
    complexity: 0,
    loc: linesTotal,
    ncloc: linesTotal,
    packages,
    files,
    classes: files,
  };
};
