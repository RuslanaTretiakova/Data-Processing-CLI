import readline from 'readline';
import { handleNavigation } from './navigation.js';
import { parseArgs } from './utils/argParser.js';

import csvToJson from './commands/csvToJson.js';

export function startRepl(initialDir) {
  let cwd = initialDir;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed === '.exit') {
      console.log('Thank you for using Data Processing CLI!');
      process.exit(0);
    }

    const [command, ...rest] = trimmed.split(' ');
    const args = parseArgs(rest);

    try {
      switch (command) {
        case 'up':
        case 'cd':
        case 'ls':
          cwd = await handleNavigation(command, args, cwd);
          break;

        case 'csv-to-json':
          await csvToJson(args, cwd);
          break;

        default:
          console.log('Invalid input');
      }
    } catch {
      console.log('Operation failed');
    }

    console.log(`You are currently in ${cwd}`);
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    console.log('\nThank you for using Data Processing CLI!');
    process.exit(0);
  });
}