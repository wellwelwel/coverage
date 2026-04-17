import type { TestCase } from '../../../../src/@types/tests.ts';
import { test } from 'poku';
import { fixture } from '../../../__utils__/fixture.ts';
import { html } from '../../../__utils__/readers/html.ts';
import { runtimesFor } from '../../../__utils__/runtime.ts';
import { snapshot } from '../../../__utils__/snapshot.ts';

for (const runtime of runtimesFor('html-spa')) {
  const testCase: TestCase = {
    reporter: 'html-spa',
    runtime,
    name: 'skip-empty',
  };

  await test(`${runtime}: ${testCase.name}`, async () => {
    const result = await fixture.run(testCase);

    snapshot.matchTree(
      html.read(result.fixtureRoot),
      testCase,
      'Hides files with no executable code from summary rows when skipEmpty is true'
    );
  });
}
