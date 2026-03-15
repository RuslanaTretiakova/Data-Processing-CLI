import fs from 'fs/promises';
import crypto from 'crypto';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED = ['sha256', 'md5', 'sha512'];

export default async function hashCompare(args, cwd) {
  const input = args.input;
  const hashFile = args.hash;
  let algorithm = args.algorithm || 'sha256';

  if (!input || !hashFile) {
    console.log('Invalid input');
    return;
  }

  if (!SUPPORTED.includes(algorithm)) {
    console.log('Operation failed');
    return;
  }

  const inputPath = resolvePath(cwd, input);
  const hashPath = resolvePath(cwd, hashFile);

  if (!inputPath || !hashPath) {
    console.log('Invalid input');
    return;
  }

  try {
    const expectedRaw = await fs.readFile(hashPath, 'utf-8');
    const expected = expectedRaw.trim().toLowerCase();

    const hash = crypto.createHash(algorithm);
    const stream = (await import('fs')).default.createReadStream(inputPath);

    await new Promise((resolve, reject) => {
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    const actual = hash.digest('hex').toLowerCase();

    if (actual === expected) {
      console.log('OK');
    } else {
      console.log('MISMATCH');
    }
  } catch {
    console.log('Operation failed');
  }
}