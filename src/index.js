require('dotenv').config();
const express = require('express');
const gracefulShutdown = require('http-graceful-shutdown');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { fetchAuthManager } = require('fetch-auth-manager/server');
const withGraphql = require('./graphql');
const database = require('./database');
const errorMiddleware = require('./middleware/error-handler');
const payment = require('./services/payment');
const { createFileCleanerMiddleware } = require('./services/aws');

const app = express();
const PORT = process.env.PORT || 3000;

const corsConfig = {
  origin: [],

  preflightContinue: false,
  credentials: true,
};

if (process.env.NODE_ENV === 'development') {
  corsConfig.origin.push('http://localhost:3000');
}


app.use(helmet());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors(corsConfig));
app.use(fetchAuthManager());
app.use(errorMiddleware);

const httpServer = withGraphql(
  app,
  { database, payment },
);

app.get('/cleanup', createFileCleanerMiddleware({ database }));

app.all('*', (req, res) => {
  res.status(404).send('here be dragons');
});

function onReady() {
  console.info(`Started server at ${new Date().toISOString()} in port ${PORT}!`);
}

httpServer.listen(PORT, onReady);

gracefulShutdown(httpServer, {
  finally: () => {
    console.info(`\nServer stopped at ${new Date().toISOString()}`);
  },
});
