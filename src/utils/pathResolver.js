import path from 'path';

export function resolvePath(cwd, p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.resolve(cwd, p);
}