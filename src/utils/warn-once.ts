const seen = new Set<string>();

export const warnOnce = (warningKey: string, message: string): void => {
  if (seen.has(warningKey)) return;

  seen.add(warningKey);
  console.warn(message);
};
