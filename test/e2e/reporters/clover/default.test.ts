import type { TestCase } from '../../../../src/@types/tests.ts';
import { test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { xml } from '../../../__utils__/readers/xml.ts';
import { runtimesFor } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimesFor('clover')) {
  const testCase: TestCase = {
    reporter: 'clover',
    runtime,
    name: 'default',
    extension: 'xml',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);

    snapshot.match(
      xml.read(result.fixtureRoot, 'clover.xml'),
      testCase,
      'Writes clover.xml with default configuration'
    );
  });
}
