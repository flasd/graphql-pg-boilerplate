require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');

async function main() {
  console.info('Detecting running Postgres container...');
  const { stdout: dockerPsStdout } = await shellExec('docker ps');

  if (
    dockerPsStdout.includes('postgres')
    && dockerPsStdout.includes('Up')
    && dockerPsStdout.includes(`${process.env.POSTGRES_PORT}/tcp`)
  ) {
    console.info('Ok.\n');
    return;
  }

  console.error('No postgres instance running.\n');
  process.exit(1);
}

main();
