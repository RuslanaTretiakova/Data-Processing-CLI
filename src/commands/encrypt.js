import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async function encrypt(args, cwd) {
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

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(outputPath);

  try {
    writeStream.write(salt);
    writeStream.write(iv);

    await pipeline(readStream, cipher, writeStream);

    const authTag = cipher.getAuthTag();
    const appendStream = fs.createWriteStream(outputPath, { flags: 'a' });
    appendStream.write(authTag);
    appendStream.end();
  } catch {
    console.log('Operation failed');
  }
}