export type IgnoreDirective = {
  count?: number;
  start?: boolean;
  stop?: boolean;
};

export type IgnoreDirectivesHandler = {
  parseSource: (source: string) => Set<number>;
};
