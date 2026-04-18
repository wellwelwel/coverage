import type { TestCase } from '../../../../src/@types/tests.ts';
import { strict, test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { lcov } from '../../../__utils__/readers/lcov.ts';
import { runtimes } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimes) {
  const testCase: TestCase = {
    reporter: 'lcovonly',
    runtime,
    name: 'exclude-before-remap',
    extension: 'json',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);
    const lcovContent = await lcov.read(result.fixtureRoot);

    snapshot.match(
      lcovContent,
      testCase,
      'Applies pre-remap filter on transpiled source path'
    );

    strict.ok(
      !lcovContent.includes('transpiled.js'),
      `excludeAfterRemap: false should filter out src/transpiled.js on ${runtime}`
    );
  });
}
