import type { ArmCoverageHandler, V8Range } from '../../@types/v8.js';

const isArmCovered = (
  armStart: number,
  armEnd: number,
  allScriptRanges: readonly V8Range[]
): boolean => {
  const armWidth = armEnd - armStart;
  const midpoint =
    armWidth > 0 ? armStart + Math.floor(armWidth / 2) : armStart;

  let innermostRange: V8Range | null = null;
  let innermostSpan = Number.POSITIVE_INFINITY;

  for (const candidateRange of allScriptRanges) {
    if (candidateRange.startOffset > midpoint) continue;
    if (candidateRange.endOffset <= midpoint) continue;

    const candidateSpan = candidateRange.endOffset - candidateRange.startOffset;

    if (candidateSpan < innermostSpan) {
      innermostSpan = candidateSpan;
      innermostRange = candidateRange;
    }
  }

  if (innermostRange === null) return true;
  return innermostRange.count > 0;
};

export const armCoverage: ArmCoverageHandler = { isArmCovered };
