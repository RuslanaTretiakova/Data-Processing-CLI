import fs from 'fs';
import { resolvePath } from '../utils/pathResolver.js';

export default async function count(args, cwd) {
  const input = args.input;

  if (!input) {
    console.log('Invalid input');
    return;
  }

  const inputPath = resolvePath(cwd, input);
  if (!inputPath) {
    console.log('Invalid input');
    return;
  }

  const readStream = fs.createReadStream(inputPath, { encoding: 'utf-8' });

  let lines = 0;
  let words = 0;
  let chars = 0;
  let leftover = '';

  const done = new Promise((resolve, reject) => {
    readStream.on('data', chunk => {
      const text = leftover + chunk.toString();
      chars += text.length;

      const parts = text.split('\n');
      leftover = parts.pop() ?? '';

      lines += parts.length;

      const wordText = parts.join('\n');
      const w = wordText.trim().split(/\s+/).filter(Boolean);
      words += w.length;
    });

    readStream.on('end', () => {
      if (leftover) {
        lines += 1;
        const w = leftover.trim().split(/\s+/).filter(Boolean);
        words += w.length;
        chars += leftover.length;
      }
      resolve();
    });

    readStream.on('error', reject);
  });

  try {
    await done;
    console.log(`Lines: ${lines}`);
    console.log(`Words: ${words}`);
    console.log(`Characters: ${chars}`);
  } catch {
    console.log('Operation failed');
  }
}