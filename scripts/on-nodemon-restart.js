
require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');
const fs = require('fs');
const path = require('path');

const lastProcess = path.join(__dirname, '.last.txt');

async function main() {
  const id = Math.round(Math.random() * 10000);
  fs.writeFileSync(lastProcess, id);

  const isWindows = process.platform === 'win32';
  const CLEAR = isWindows ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';

  process.stdout.write(CLEAR);

  const result = await shellExec('yarn lint --color');

  const latestProcessId = fs.readFileSync(lastProcess).toString();

  if (parseInt(latestProcessId, 10) !== id) {
    return;
  }

  const parsed = result.stdout.replace(/^.+\n/, '');

  if (parsed) {
    process.stdout.write(parsed);
    process.stdout.write('\n');
  }
}

main();
