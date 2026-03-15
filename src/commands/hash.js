import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED = ['sha256', 'md5', 'sha512'];

export default async function hash(args, cwd) {
  const input = args.input;
  let algorithm = args.algorithm || 'sha256';
  const save = !!args.save;

  if (!input) {
    console.log('Invalid input');
    return;
  }

  if (!SUPPORTED.includes(algorithm)) {
    console.log('Operation failed');
    return;
  }

  const inputPath = resolvePath(cwd, input);
  if (!inputPath) {
    console.log('Invalid input');
    return;
  }

  const readStream = fs.createReadStream(inputPath);
  const hash = crypto.createHash(algorithm);

  try {
    await pipeline(readStream, hash);
    const digest = hash.digest('hex');
    console.log(`${algorithm}: ${digest}`);

    if (save) {
      const outPath = `${inputPath}.${algorithm}`;
      await fs.promises.writeFile(outPath, digest + '\n', 'utf-8');
    }
  } catch {
    console.log('Operation failed');
  }
}