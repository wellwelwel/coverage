export type FileFilterOptions = {
  include?: readonly string[];
  exclude?: readonly string[];
};

export type ResolvedFileFilter = {
  includeRegexes: readonly RegExp[];
  excludeRegexes: readonly RegExp[];
};
