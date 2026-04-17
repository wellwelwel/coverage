import type { RowMetrics } from '../../@types/text.js';
import { pctValue } from './metrics.js';

const FULL_COVERAGE_PCT = 100;

export const shouldHideFileRow = (
  metrics: RowMetrics,
  skipFull: boolean,
  skipEmpty: boolean
): boolean => {
  const percentages = [
    pctValue(metrics.statements),
    pctValue(metrics.branches),
    pctValue(metrics.functions),
    pctValue(metrics.lines),
  ];

  if (skipEmpty && percentages.every((percentage) => percentage === null))
    return true;

  if (skipFull) {
    const concretePercentages = percentages.filter(
      (percentage): percentage is number => percentage !== null
    );

    if (
      concretePercentages.length > 0 &&
      concretePercentages.every((percentage) => percentage >= FULL_COVERAGE_PCT)
    )
      return true;
  }

  return false;
};
