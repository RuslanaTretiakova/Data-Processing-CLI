import fs from 'fs';
import os from 'os';
import { Worker } from 'worker_threads';
import path from 'path';
import { resolvePath } from '../utils/pathResolver.js';

export default async function logStats(args, cwd) {
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

  const stat = await fs.promises.stat(inputPath).catch(() => null);
  if (!stat) {
    console.log('Operation failed');
    return;
  }

  const cores = os.cpus().length || 1;
  const size = stat.size;
  const chunkSize = Math.ceil(size / cores);

  const fd = await fs.promises.open(inputPath, 'r');

  const workers = [];
  const promises = [];

  try {
    for (let i = 0; i < cores; i++) {
      const start = i * chunkSize;
      let end = Math.min((i + 1) * chunkSize - 1, size - 1);

      if (start > end) break;

      const { startPos, endPos } = await adjustToLine(fd, start, end, size, i === 0, i === cores - 1);

      const length = endPos - startPos + 1;
      const buffer = Buffer.alloc(length);
      await fd.read(buffer, 0, length, startPos);

      const worker = new Worker(path.resolve('src/workers/logWorker.js'));
      workers.push(worker);

      const p = new Promise((resolve, reject) => {
        worker.once('message', resolve);
        worker.once('error', reject);
      });

      worker.postMessage(buffer);
      promises.push(p);
    }

    const results = await Promise.all(promises);

    const merged = {
      total: 0,
      levels: {},
      status: {},
      paths: {},
      responseTimeSum: 0
    };

    for (const r of results) {
      merged.total += r.total;
      merged.responseTimeSum += r.responseTimeSum;

      for (const [k, v] of Object.entries(r.levels)) {
        merged.levels[k] = (merged.levels[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(r.status)) {
        merged.status[k] = (merged.status[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(r.paths)) {
        merged.paths[k] = (merged.paths[k] || 0) + v;
      }
    }

    const topPaths = Object.entries(merged.paths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    const avgResponseTimeMs =
      merged.total > 0 ? merged.responseTimeSum / merged.total : 0;

    const result = {
      total: merged.total,
      levels: merged.levels,
      status: merged.status,
      topPaths,
      avgResponseTimeMs: Number(avgResponseTimeMs.toFixed(2))
    };

    await fs.promises.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  } catch {
    console.log('Operation failed');
  } finally {
    await fd.close();
    for (const w of workers) w.terminate();
  }
}

async function adjustToLine(fd, start, end, size, isFirst, isLast) {
  let startPos = start;
  let endPos = end;

  if (!isFirst) {
    const buf = Buffer.alloc(1);
    while (startPos < size) {
      await fd.read(buf, 0, 1, startPos);
      if (buf[0] === 0x0a) {
        startPos += 1;
        break;
      }
      startPos += 1;
    }
  }

  if (!isLast) {
    const buf = Buffer.alloc(1);
    while (endPos < size - 1) {
      await fd.read(buf, 0, 1, endPos);
      if (buf[0] === 0x0a) {
        break;
      }
      endPos += 1;
    }
  } else {
    endPos = size - 1;
  }

  return { startPos, endPos };
}