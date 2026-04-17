import type { TestCase } from '../../../../src/@types/tests.ts';
import { existsSync } from 'node:fs';
import { strict, test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { html } from '../../../__utils__/readers/html.ts';
import { lcov } from '../../../__utils__/readers/lcov.ts';
import { runtimesFor } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimesFor('lcov')) {
  const testCase: TestCase = {
    reporter: 'lcov',
    runtime,
    name: 'default',
    extension: 'lcov.info',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);
    const reportDir = `${result.fixtureRoot}/coverage/lcov-report`;

    snapshot.match(
      lcov.read(result.fixtureRoot),
      testCase,
      'Emits lcov.info via delegated lcovonly reporter'
    );

    if (runtime === 'bun') {
      strict.equal(
        existsSync(reportDir),
        false,
        'lcov-report/ must not be created on Bun'
      );
      return;
    }

    strict.equal(
      existsSync(reportDir),
      true,
      'lcov-report/ must be created on Node and Deno'
    );

    snapshot.matchTree(
      html.read(result.fixtureRoot, 'lcov-report'),
      testCase,
      'Emits lcov-report/ html tree via delegated html reporter'
    );
  });
}
