import type { HtmlProjectedCoverage } from '../../../../@types/html.js';
import type { ReporterContext } from '../../../../@types/reporters.js';
import { lcovonly } from '../../../lcovonly/index.js';
import { projectLcovModel } from '../project-lcov-model.js';

const project = (context: ReporterContext): HtmlProjectedCoverage | null => {
  const lcovText = lcovonly.runtimes.bun.produce(context);
  if (lcovText.length === 0) return null;

  const coverageModel = lcovonly.parse(lcovText, context.cwd);
  if (coverageModel.length === 0) return null;

  return projectLcovModel(coverageModel);
};

export const bun = { project } as const;
