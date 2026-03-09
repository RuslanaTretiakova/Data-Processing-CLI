import os from 'os';
import { startRepl } from './repl.js';

function main() {
  const initialDir = os.homedir();
  
  console.log('Welcome to Data Processing CLI!');

  console.log(`You are currently in ${initialDir}`);

  startRepl(initialDir);
}

main();