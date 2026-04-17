import type { HtmlSpaShellInput } from '../../@types/html.js';

export const renderShell = (input: HtmlSpaShellInput): string =>
  `<!doctype html>
<html lang="en">
<head>
<link rel="stylesheet" href="spa.css" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Code coverage report for All files</title>
</head>
<body>
<div id="app" class="app"></div>
<script>
window.data = ${JSON.stringify(input.data)};
window.generatedDatetime = ${JSON.stringify(input.datetime)};
window.metricsToShow = ${JSON.stringify(input.metricsToShow)};
</script>
<script src="bundle.js"></script>
</body>
</html>
`;
