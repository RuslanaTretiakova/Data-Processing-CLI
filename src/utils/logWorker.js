import { parentPort } from 'worker_threads';

parentPort.on('message', (chunk) => {
  const text = chunk.toString();
  const lines = text.split('\n').filter(Boolean);

  const levels = {};
  const status = {};
  const paths = {};
  let total = 0;
  let responseTimeSum = 0;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;

    const level = parts[1];
    const statusCode = parseInt(parts[3], 10);
    const responseTime = parseFloat(parts[4]);
    const path = parts[6];

    total += 1;

    levels[level] = (levels[level] || 0) + 1;

    const statusClass = Math.floor(statusCode / 100) + 'xx';
    status[statusClass] = (status[statusClass] || 0) + 1;

    paths[path] = (paths[path] || 0) + 1;

    if (!Number.isNaN(responseTime)) {
      responseTimeSum += responseTime;
    }
  }

  parentPort.postMessage({
    total,
    levels,
    status,
    paths,
    responseTimeSum
  });
});