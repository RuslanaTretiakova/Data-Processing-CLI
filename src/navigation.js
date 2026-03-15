import fs from 'fs/promises';
import path from 'path';

export async function handleNavigation(command, args, cwd) {
  if (command === 'up') {
    const parent = path.dirname(cwd);
    return parent === cwd ? cwd : parent;
  }

  if (command === 'cd') {
    const target = args._[0];
    if (!target) {
      console.log('Invalid input');
      return cwd;
    }

    const newPath = path.resolve(cwd, target);

    try {
      const stat = await fs.stat(newPath);
      if (!stat.isDirectory()) throw new Error();
      return newPath;
    } catch {
      console.log('Operation failed');
      return cwd;
    }
  }

  if (command === 'ls') {
    try {
      const entries = await fs.readdir(cwd, { withFileTypes: true });

      const folders = entries
        .filter(e => e.isDirectory())
        .map(e => `${e.name}  [folder]`)
        .sort();

      const files = entries
        .filter(e => e.isFile())
        .map(e => `${e.name}  [file]`)
        .sort();

      [...folders, ...files].forEach(line => console.log(line));
    } catch {
      console.log('Operation failed');
    }
    return cwd;
  }

  return cwd;
}