const normalizeLcov = (content: string, fixtureRoot: string): string => {
  const normalizedEndings = content.replace(/\r\n/g, '\n');
  const prefix = `SF:${fixtureRoot}/`;

  return normalizedEndings
    .split('\n')
    .map((rawLine) =>
      rawLine.startsWith(prefix)
        ? `SF:${rawLine.slice(prefix.length)}`
        : rawLine
    )
    .join('\n');
};

const normalizeHtml = (content: string): string =>
  content
    .replace(/\r\n/g, '\n')
    .replace(/at \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, 'at <datetime>')
    .replace(
      /window\.generatedDatetime = "[^"]*"/g,
      'window.generatedDatetime = "<datetime>"'
    );

const normalizeText = (content: string, fixtureRoot?: string): string => {
  const normalizedEndings = content.replace(/\r\n/g, '\n');
  const topLeftIndex = normalizedEndings.indexOf('┌');
  const bottomRightIndex = normalizedEndings.lastIndexOf('┘');

  const extracted =
    topLeftIndex >= 0 && bottomRightIndex > topLeftIndex
      ? normalizedEndings.slice(topLeftIndex, bottomRightIndex + 1)
      : normalizedEndings;

  if (fixtureRoot === undefined) return extracted;

  const encodedFixtureRoot = encodeURIComponent(fixtureRoot);

  return extracted
    .split(fixtureRoot)
    .join('<fixtureRoot>')
    .split(encodedFixtureRoot)
    .join('<fixtureRoot>');
};

const SUMMARY_HEADER =
  '=============================== Coverage summary ===============================';
const SUMMARY_FOOTER =
  '================================================================================';

const normalizeTextSummary = (content: string): string => {
  const normalizedEndings = content.replace(/\r\n/g, '\n');
  const headerIndex = normalizedEndings.indexOf(SUMMARY_HEADER);
  const footerIndex = normalizedEndings.lastIndexOf(SUMMARY_FOOTER);

  if (headerIndex < 0 || footerIndex <= headerIndex) return normalizedEndings;

  return normalizedEndings.slice(
    headerIndex,
    footerIndex + SUMMARY_FOOTER.length
  );
};

const TEAMCITY_BLOCK_OPENED =
  "##teamcity[blockOpened name='Code Coverage Summary']";
const TEAMCITY_BLOCK_CLOSED =
  "##teamcity[blockClosed name='Code Coverage Summary']";

const normalizeTeamcity = (content: string): string => {
  const normalizedEndings = content.replace(/\r\n/g, '\n');
  const openedIndex = normalizedEndings.indexOf(TEAMCITY_BLOCK_OPENED);
  const closedIndex = normalizedEndings.lastIndexOf(TEAMCITY_BLOCK_CLOSED);

  if (openedIndex < 0 || closedIndex <= openedIndex) return normalizedEndings;

  return normalizedEndings.slice(
    openedIndex,
    closedIndex + TEAMCITY_BLOCK_CLOSED.length
  );
};

const normalizeJsonSummary = (content: string, fixtureRoot: string): string => {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split(fixtureRoot)
    .join('<fixtureRoot>')
    .replace(
      /\/[^"]*\/test\/__fixtures__\/e2e\/[^/]+\/[^/]+\/[^/"]+/g,
      '<fixtureRoot>'
    );

  const parsed = JSON.parse(normalized) as Record<string, unknown>;
  const sortedKeys = Object.keys(parsed).sort();
  const sortedPayload: Record<string, unknown> = Object.create(null);

  for (const sortedKey of sortedKeys)
    sortedPayload[sortedKey] = parsed[sortedKey];

  return JSON.stringify(sortedPayload, null, 2);
};

const sortClassesBlocks = (content: string): string =>
  content.replace(
    /([ \t]*)<classes>\n([\s\S]*?)\n([ \t]*)<\/classes>/g,
    (_match, openingIndent: string, body: string, closingIndent: string) => {
      const classBlocks = body.match(/[ \t]*<class [\s\S]*?<\/class>(?=\n|$)/g);
      if (classBlocks === null) return _match;

      const sortedBlocks = [...classBlocks].sort((left, right) => {
        const leftFilename = left.match(/filename="([^"]+)"/)?.[1] ?? '';
        const rightFilename = right.match(/filename="([^"]+)"/)?.[1] ?? '';

        return leftFilename.localeCompare(rightFilename);
      });

      return `${openingIndent}<classes>\n${sortedBlocks.join('\n')}\n${closingIndent}</classes>`;
    }
  );

const sortFilesWithinPackages = (content: string): string =>
  content.replace(
    /([ \t]*)<package ([^>]*)>\n([\s\S]*?)\n([ \t]*)<\/package>/g,
    (
      match,
      openingIndent: string,
      packageAttributes: string,
      body: string,
      closingIndent: string
    ) => {
      const fileBlocks = body.match(/[ \t]*<file [\s\S]*?<\/file>(?=\n|$)/g);
      if (fileBlocks === null) return match;

      const sortedBlocks = [...fileBlocks].sort((left, right) => {
        const leftPath = left.match(/path="([^"]+)"/)?.[1] ?? '';
        const rightPath = right.match(/path="([^"]+)"/)?.[1] ?? '';

        return leftPath.localeCompare(rightPath);
      });

      const bodyWithoutFiles = body
        .replace(/[ \t]*<file [\s\S]*?<\/file>(?:\n|(?=$))/g, '')
        .replace(/\n+$/, '');

      return `${openingIndent}<package ${packageAttributes}>\n${bodyWithoutFiles}\n${sortedBlocks.join('\n')}\n${closingIndent}</package>`;
    }
  );

const FIXTURE_PATH_PATTERN =
  /\/[^<>"'\s]*\/test\/__fixtures__\/e2e\/[^/<>"'\s]+\/[^/<>"'\s]+\/[^/<>"'\s]+/g;

const normalizeXml = (content: string, fixtureRoot: string): string =>
  sortFilesWithinPackages(
    sortClassesBlocks(
      content
        .replace(/\r\n/g, '\n')
        .replace(/ (generated|timestamp)="\d+"/g, ' $1="<$1>"')
        .split(fixtureRoot)
        .join('<fixtureRoot>')
        .replace(FIXTURE_PATH_PATTERN, '<fixtureRoot>')
    )
  );

const normalizeJson = (content: string, fixtureRoot: string): string => {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split(fixtureRoot)
    .join('<fixtureRoot>');

  const parsed = JSON.parse(normalized) as Record<string, unknown>;
  const sortedKeys = Object.keys(parsed).sort();
  const sortedPayload: Record<string, unknown> = Object.create(null);

  for (const sortedKey of sortedKeys)
    sortedPayload[sortedKey] = parsed[sortedKey];

  return JSON.stringify(sortedPayload, null, 2);
};

type V8Range = {
  startOffset: number;
  endOffset: number;
  count: number | string;
  isBlockCoverage: boolean;
};

type V8Function = {
  functionName: string;
  ranges: V8Range[];
  isBlockCoverage: boolean;
};

type V8ScriptCoverage = {
  scriptId?: string;
  url: string;
  functions: V8Function[];
};

type V8Dump = {
  result?: V8ScriptCoverage[];
  timestamp?: number;
};

const extractScripts = (
  parsed: V8Dump | V8ScriptCoverage
): V8ScriptCoverage[] => {
  if ('result' in parsed && Array.isArray(parsed.result)) return parsed.result;
  if ('url' in parsed && 'functions' in parsed) return [parsed];
  return [];
};

const normalizeV8 = (content: string, fixtureRoot: string): string | null => {
  const parsed = JSON.parse(content.replace(/\r\n/g, '\n')) as
    | V8Dump
    | V8ScriptCoverage;
  const projectPrefix = `file://${fixtureRoot}/`;

  const projectScripts = extractScripts(parsed).filter((scriptCoverage) =>
    scriptCoverage.url.startsWith(projectPrefix)
  );

  if (projectScripts.length === 0) return null;

  const normalizedScripts = projectScripts.map((scriptCoverage) => {
    const normalizedUrl = `file://<fixtureRoot>/${scriptCoverage.url.slice(projectPrefix.length)}`;

    const normalizedFunctions = scriptCoverage.functions
      .map((functionEntry) => {
        const sortedRanges = [...functionEntry.ranges]
          .sort((left, right) => left.startOffset - right.startOffset)
          .map((range) => ({
            startOffset: range.startOffset,
            endOffset: range.endOffset,
            count: '<count>',
            isBlockCoverage: range.isBlockCoverage,
          }));

        return {
          functionName: functionEntry.functionName,
          ranges: sortedRanges,
          isBlockCoverage: functionEntry.isBlockCoverage,
        };
      })
      .sort((left, right) => {
        const nameCompare = left.functionName.localeCompare(right.functionName);
        if (nameCompare !== 0) return nameCompare;
        return (
          (left.ranges[0]?.startOffset ?? 0) -
          (right.ranges[0]?.startOffset ?? 0)
        );
      });

    return {
      url: normalizedUrl,
      functions: normalizedFunctions,
    };
  });

  normalizedScripts.sort((left, right) => left.url.localeCompare(right.url));

  return JSON.stringify({ result: normalizedScripts }, null, 2);
};

export const paths = {
  normalizeLcov,
  normalizeHtml,
  normalizeText,
  normalizeTextSummary,
  normalizeTeamcity,
  normalizeJsonSummary,
  normalizeJson,
  normalizeXml,
  normalizeV8,
} as const;
