require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');

async function main() {
  console.info('Detecting running Postgres container...');
  const result = await shellExec('docker ps');

  if (result.stdout.indexOf('postgres') !== -1 && result.stdout.indexOf('Up') !== -1) {
    console.error('Ok.\n');
    return;
  }

  console.error('No postgres instance running.\n');
  process.exit(1);
}

main();
