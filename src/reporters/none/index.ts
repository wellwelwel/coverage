/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

import type { Reporter } from '../../@types/reporters.js';

const report: Reporter = () => {};

export const none = { report } as const;
