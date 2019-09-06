
require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');

async function main() {
  const isWindows = process.platform === 'win32';
  const CLEAR = isWindows ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';

  process.stdout.write(CLEAR);

  const result = await shellExec('yarn lint --color');

  const parsed = result.stdout.replace(/^.+\n/, '');

  if (parsed) {
    process.stdout.write(parsed);
    process.stdout.write('\n');
  }
}

main();
