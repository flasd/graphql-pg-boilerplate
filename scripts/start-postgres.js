require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const shellExec = require('shell-exec');

async function main() {
  const isCreate = process.argv.includes('--create');

  if (isCreate) {
    console.info('\nStopping running Postgres container...\n');
    await shellExec('docker stop postgres');
    await shellExec('docker rm postgres');
  }

  const { stdout: dockerPsStdOut } = await shellExec('docker ps');

  if (dockerPsStdOut.includes('postgres') && dockerPsStdOut.includes(`${process.env.POSTGRES_PORT}/tcp`)) {
    if (isCreate) {
      console.info('Found postgress instance running after stopping it.\nYou probably have many instances running. Aborting.\n');
      process.exit(1);
      return;
    }
    console.info('Found running postgres instance. Using it.\n');
  } else {
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

  console.info(`For creating and migrating your database, run:
  'yarn run sequelize db:create && yarn run sequelize db:migrate'
  `);
}

main();
