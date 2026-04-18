import type { TestCase } from '../../../../src/@types/tests.ts';
import { test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { xml } from '../../../__utils__/readers/xml.ts';
import { runtimesFor } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimesFor('cobertura')) {
  const testCase: TestCase = {
    reporter: 'cobertura',
    runtime,
    name: 'exclude-after-remap',
    extension: 'json',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);

    snapshot.match(
      xml.read(result.fixtureRoot, 'cobertura-coverage.xml'),
      testCase,
      'Writes cobertura-coverage.xml excluding transpiled files after remapping'
    );
  });
}
