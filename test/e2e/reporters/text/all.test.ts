import type { TestCase } from '../../../../src/@types/tests.ts';
import { test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { text } from '../../../__utils__/readers/text.ts';
import { runtimesFor } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimesFor('text')) {
  const testCase: TestCase = {
    reporter: 'text',
    runtime,
    name: 'all',
    extension: 'txt',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);

    snapshot.match(
      text.read(result),
      testCase,
      'Emits text table with include, exclude and all:true'
    );
  });
}
