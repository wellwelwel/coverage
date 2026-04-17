export type FileFilterOptions = {
  include?: readonly string[];
  exclude?: readonly string[];
};

export type ResolvedFileFilter = {
  includeRegexes: readonly RegExp[];
  excludeRegexes: readonly RegExp[];
};

export type FileFilterHandler = {
  getDefaultExclude: () => readonly string[];
  resolve: (options: FileFilterOptions) => ResolvedFileFilter;
  matches: (
    resolved: ResolvedFileFilter,
    absolutePath: string,
    cwd: string
  ) => boolean;
};
