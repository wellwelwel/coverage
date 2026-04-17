import type { FileAggregation } from '../../@types/v8.js';
import { relativize } from '../../utils/paths.js';

export const serializeFileRecord = (
  file: string,
  aggregation: FileAggregation,
  cwd: string
): string => {
  const record: string[] = [];

  record.push('TN:');
  record.push(`SF:${relativize(file, cwd)}`);

  const namedFunctions = Array.from(aggregation.functions.values())
    .filter((entry) => entry.name !== '')
    .sort((left, right) => left.line - right.line);

  for (const namedFunction of namedFunctions)
    record.push(`FN:${namedFunction.line},${namedFunction.name}`);

  record.push(`FNF:${namedFunctions.length}`);
  record.push(
    `FNH:${namedFunctions.filter((entry) => entry.outerCount > 0).length}`
  );

  for (const namedFunction of namedFunctions)
    record.push(`FNDA:${namedFunction.outerCount},${namedFunction.name}`);

  const sortedLines = Array.from(aggregation.lineHits.entries()).sort(
    (left, right) => left[0] - right[0]
  );

  for (const [lineNumber, hits] of sortedLines)
    record.push(`DA:${lineNumber},${hits}`);

  record.push(`LF:${sortedLines.length}`);
  record.push(`LH:${sortedLines.filter(([, hits]) => hits > 0).length}`);

  const branchFunctions = Array.from(aggregation.functions.values())
    .filter((entry) => entry.isBlockCoverage && entry.subRanges.size > 0)
    .sort((left, right) => left.line - right.line);

  let branchesFound = 0;
  let branchesHit = 0;
  let blockId = 0;

  for (const branchFunction of branchFunctions) {
    const sortedSubRanges = Array.from(branchFunction.subRanges.values()).sort(
      (left, right) => left.indexInFunction - right.indexInFunction
    );

    const outerCount = branchFunction.outerCount;
    const canCluster = outerCount > 0;

    let cursor = 0;
    while (cursor < sortedSubRanges.length) {
      let clusterEnd = -1;

      if (canCluster) {
        let runningSum = 0;
        for (
          let scanIndex = cursor;
          scanIndex < sortedSubRanges.length;
          scanIndex++
        ) {
          runningSum += sortedSubRanges[scanIndex].takenCount;
          if (runningSum > outerCount) break;
          if (runningSum === outerCount && scanIndex > cursor) {
            clusterEnd = scanIndex;
            break;
          }
        }
      }

      if (clusterEnd >= 0) {
        for (
          let memberIndex = cursor;
          memberIndex <= clusterEnd;
          memberIndex++
        ) {
          const subRange = sortedSubRanges[memberIndex];
          const branchIndex = memberIndex - cursor;
          record.push(
            `BRDA:${subRange.line},${blockId},${branchIndex},${subRange.takenCount}`
          );
          branchesFound++;
          if (subRange.takenCount > 0) branchesHit++;
        }
        blockId++;
        cursor = clusterEnd + 1;
        continue;
      }

      const subRange = sortedSubRanges[cursor];
      const taken = subRange.takenCount;
      const isLoopBody = taken > outerCount;

      record.push(`BRDA:${subRange.line},${blockId},0,${taken}`);
      branchesFound++;
      if (taken > 0) branchesHit++;

      if (!isLoopBody) {
        const notTaken = outerCount - taken;
        record.push(`BRDA:${subRange.line},${blockId},1,${notTaken}`);
        branchesFound++;
        if (notTaken > 0) branchesHit++;
      }

      blockId++;
      cursor++;
    }
  }

  record.push(`BRF:${branchesFound}`);
  record.push(`BRH:${branchesHit}`);

  record.push('end_of_record');

  return record.join('\n');
};

export const serializeLcov = (
  fileAggregations: Map<string, FileAggregation>,
  cwd: string
): string => {
  if (fileAggregations.size === 0) return '';

  const chunks: string[] = [];
  const sortedFiles = Array.from(fileAggregations.keys()).sort();

  for (const file of sortedFiles) {
    const aggregation = fileAggregations.get(file);
    if (!aggregation) continue;
    if (aggregation.lineHits.size === 0 && aggregation.functions.size === 0)
      continue;

    chunks.push(serializeFileRecord(file, aggregation, cwd));
  }

  return chunks.length === 0 ? '' : chunks.join('\n') + '\n';
};
