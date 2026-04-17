import type { ColorName } from '../../@types/text.js';
import type {
  WatermarkLevel,
  WatermarkMetric,
  Watermarks,
} from '../../@types/watermarks.js';
import process from 'node:process';
import { watermarks } from '../../watermarks.js';

const ANSI: Record<ColorName, string> = {
  red: '\x1b[1;91m',
  yellow: '\x1b[0;93m',
  green: '\x1b[0;92m',
  gray: '\x1b[0;90m',
  dim: '\x1b[2m',
  dimGray: '\x1b[2;90m',
};

const ANSI_RESET = '\x1b[0m';

const LEVEL_COLORS: Record<WatermarkLevel, ColorName> = {
  low: 'red',
  medium: 'yellow',
  high: 'green',
};

const colorEnabled = (): boolean => {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '')
    return false;
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0')
    return true;
  return process.stdout.isTTY === true;
};

export const colorize = (text: string, color: ColorName): string => {
  if (!colorEnabled()) return text;
  return `${ANSI[color]}${text}${ANSI_RESET}`;
};

export const colorForPct = (
  resolved: Watermarks,
  metric: WatermarkMetric,
  value: number | null
): ColorName => {
  const level = watermarks.classForPercent(resolved, metric, value);

  if (level === null) return 'dim';
  return LEVEL_COLORS[level];
};
