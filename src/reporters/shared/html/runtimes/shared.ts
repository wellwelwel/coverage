import type { HtmlProjectedCoverage } from '../../../../@types/html.js';
import type { ReporterContext } from '../../../../@types/reporters.js';
import { projectCoverageMap } from '../project-coverage-map.js';

const project = (context: ReporterContext): HtmlProjectedCoverage | null => {
  const coverageMap = context.produceCoverageMap();
  if (coverageMap === null) return null;

  return projectCoverageMap(coverageMap);
};

export const viaV8Istanbul = { project } as const;
