require('dotenv').config();
const express = require('express');
const gracefulShutdown = require('http-graceful-shutdown');
const cors = require('cors');
const helmet = require('helmet');
const { fetchAuthManager } = require('fetch-auth-manager/server');
const withGraphql = require('./graphql');
const database = require('./database');
const errorMiddleware = require('./middleware/error-handler');
const { payment, createPostbackHandler } = require('./services/payment');
const { createFileCleanerMiddleware } = require('./services/aws');

const app = express();
const PORT = process.env.PORT || 3000;

const corsConfig = {
  origin: [],

  preflightContinue: false,
  credentials: true,
  exposedHeaders: [
    'X-Token-Create',
    'X-Token-Update',
    'X-Token-Remove',
  ],
};


if (process.env.NODE_ENV === 'development') {
  corsConfig.origin.push('http://localhost:3000');
}


app.use(helmet());
app.use(cors(corsConfig));
app.use(fetchAuthManager());

const httpServer = withGraphql(
  app,
  { database, payment },
);

app.get(
  process.env.FILE_CRON_ENDPOINT,
  createFileCleanerMiddleware({ database }),
);

app.post(
  process.env.PAGARME_POSTBACK_ENDPOINT,
  createPostbackHandler({ database }),
);

app.all('*', (req, res) => {
  res.status(404).send('here be dragons');
});

app.use(errorMiddleware);

function onReady() {
  console.info(`Started server at ${new Date().toISOString()} in port ${PORT}!`);
}

async function main() {
  try {
    await database.sequelize.authenticate();
  } catch (error) {
    console.error(error);
    process.exit(1);
    return;
  }

  httpServer.listen(PORT, onReady);
}

gracefulShutdown(httpServer, {
  onShutdown: () => database.sequelize.close(),
  finally: () => {
    console.info(`\nServer gracefully stopped at ${new Date().toISOString()}`);
  },
});

main();
