export type IdeName =
  | 'jetbrains'
  | 'cursor'
  | 'windsurf'
  | 'vscode-insiders'
  | 'vscode';

export type UrlBuilder = (
  absolutePath: string,
  lineNumber: number,
  columnNumber: number
) => string;

export type IdeUrlBuilders = Record<IdeName, UrlBuilder>;
