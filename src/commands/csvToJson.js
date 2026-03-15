import fs from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async function csvToJson(args, cwd) {
  const input = args.input;
  const output = args.output;

  if (!input || !output) {
    console.log('Invalid input');
    return;
  }

  const inputPath = resolvePath(cwd, input);
  const outputPath = resolvePath(cwd, output);

  if (!inputPath || !outputPath) {
    console.log('Invalid input');
    return;
  }

  const readStream = fs.createReadStream(inputPath, { encoding: 'utf-8' });
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

  let headers = null;
  let isFirstObject = true;
  let leftover = '';

  const transform = new Transform({
    readableObjectMode: false,
    writableObjectMode: false,
    transform(chunk, _enc, callback) {
      try {
        leftover += chunk.toString();
        const lines = leftover.split('\n');
        leftover = lines.pop() ?? '';

        let out = '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (!headers) {
            headers = trimmed.split(',');
            out += '[\n';
          } else {
            const values = trimmed.split(',');
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] ?? '';
            });

            if (!isFirstObject) {
              out += ',\n';
            }
            isFirstObject = false;
            out += '  ' + JSON.stringify(obj);
          }
        }

        this.push(out);
        callback();
      } catch (err) {
        callback(err);
      }
    },
    flush(callback) {
      try {
        let out = '';
        if (!headers && leftover.trim()) {
          headers = leftover.trim().split(',');
          out += '[\n';
          leftover = '';
        }

        if (leftover.trim() && headers) {
          const values = leftover.trim().split(',');
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = values[i] ?? '';
          });

          if (!isFirstObject) {
            out += ',\n';
          }
          isFirstObject = false;
          out += '  ' + JSON.stringify(obj);
        }

        if (headers) {
          out += '\n]\n';
        } else {
          out += '[]\n';
        }

        this.push(out);
        callback();
      } catch (err) {
        callback(err);
      }
    }
  });

  try {
    await pipeline(readStream, transform, writeStream);
  } catch {
    console.log('Operation failed');
  }
}