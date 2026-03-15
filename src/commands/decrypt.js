import fs from 'fs';
import crypto from 'crypto';
import { resolvePath } from '../utils/pathResolver.js';
import { pipeline } from 'stream/promises';

export default async function decrypt(args, cwd) {
  const input = args.input;
  const output = args.output;
  const password = args.password;

  if (!input || !output || !password) {
    console.log('Invalid input');
    return;
  }

  const inputPath = resolvePath(cwd, input);
  const outputPath = resolvePath(cwd, output);

  if (!inputPath || !outputPath) {
    console.log('Invalid input');
    return;
  }

  const stat = await fs.promises.stat(inputPath);
  if (stat.size < 16 + 12 + 16) {
    console.log('Operation failed');
    return;
  }

  const fd = await fs.promises.open(inputPath, 'r');
  try {
    const salt = Buffer.alloc(16);
    const iv = Buffer.alloc(12);
    const authTag = Buffer.alloc(16);

    await fd.read(salt, 0, 16, 0);
    await fd.read(iv, 0, 12, 16);
    await fd.read(authTag, 0, 16, stat.size - 16);

    const key = crypto.scryptSync(password, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const readStream = fs.createReadStream(inputPath, {
      start: 16 + 12,
      end: stat.size - 16 - 1
    });
    const writeStream = fs.createWriteStream(outputPath);

    try {
      await pipeline(readStream, decipher, writeStream);
    } catch {
      console.log('Operation failed');
    }
  } finally {
    await fd.close();
  }
}