require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');

async function main() {
  console.info('Stopping running Postgres container...');
  await shellExec('docker stop postgres');
  await shellExec('docker rm postgres');

  console.info('Starting new Postgres container...');
  const result = await shellExec(`docker run --name postgres -p ${
    process.env.POSTGRES_PORT
  }:${
    process.env.POSTGRES_PORT
  } -e POSTGRES_PASSWORD=${
    process.env.POSTGRES_PASSWORD
  } -d postgres`);


  if (result.stderr.length !== 0) {
    console.error(result.stderr);
  } else {
    console.info(`Container started with:
    PORT ${process.env.POSTGRES_PORT}
    PASSWORD ${process.env.POSTGRES_PASSWORD}
    DOCKER_ID ${result.stdout}`);
  }
}

main();
