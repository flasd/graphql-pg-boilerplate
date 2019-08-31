require('dotenv').config();
const express = require('express');
const gracefulShutdown = require('http-graceful-shutdown');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const withGraphql = require('./graphql');
const database = require('./database');
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/error-handler');

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
app.use(authMiddleware);
app.use(errorMiddleware);

const httpServer = withGraphql(app, { database });


function onReady() {
  console.info(`Started server at ${new Date().toISOString()} in port ${PORT}!`);
}

httpServer.listen(PORT, onReady);

gracefulShutdown(httpServer, {
  finally: () => {
    console.info(`Server stopped at ${new Date().toISOString()}`);
  },
});
