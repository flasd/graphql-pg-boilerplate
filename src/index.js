require('dotenv').config();
const express = require('express');
const gracefulShutdown = require('http-graceful-shutdown');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const withGraphql = require('./graphql');
const database = require('./database');

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

withGraphql(app, { database });


function onReady() {
  console.info(`Node App running on port ${PORT}!`);
}

const server = app.listen(PORT, onReady);

gracefulShutdown(server);
