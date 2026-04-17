import type { TestCase } from '../../../../src/@types/tests.ts';
import { test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { lcov } from '../../../__utils__/readers/lcov.ts';
import { runtimes } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimes) {
  const testCase: TestCase = {
    reporter: 'lcovonly',
    runtime,
    name: 'exclude-after-remap',
    extension: 'lcov.info',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);

    snapshot.match(
      lcov.read(result.fixtureRoot),
      testCase,
      'Applies post-remap filter on original source path'
    );
  });
}
