export type XmlAttrs = Record<string, string | number>;

export type XmlBuilder = {
  openTag: (name: string, attrs?: XmlAttrs) => void;
  closeTag: (name: string) => void;
  inlineTag: (name: string, attrs?: XmlAttrs, content?: string) => void;
  closeAll: () => void;
  toString: () => string;
};
