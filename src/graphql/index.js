const path = require('path');
const http = require('http');
const { get } = require('lodash');
const cookie = require('cookie');
const { fileLoader, mergeTypes, mergeResolvers } = require('merge-graphql-schemas');
const { IsAuthenticatedDirective } = require('graphql-auth-directives');
const {
  ApolloServer, ApolloError, AuthenticationError, UserInputError,
} = require('apollo-server-express');
const { verifyAndUnpack } = require('../services/auth');

const SCHEMAS_GLOB = path.join(__dirname, './**/*.schema.gql');
const RESOLVERS_GLOB = path.join(__dirname, './**/*.js');
const DIRECTIVES_SCHEMA_GLOB = path.join(__dirname, './**/*.directive.gql');
const DIRECTIVES_CLASS_GLOB = path.join(__dirname, './**/*.directive.js');

function createContext(partialContext = {}) {
  return ({ req, res, connection }) => {
    if (connection) {
      return {
        ...connection.context,
        ...partialContext,
      };
    }

    const context = {
      req,
      res,
      headers: req.headers,
      user: req.user,
      ...partialContext,
    };

    return context;
  };
}

function formatError(error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  if (
    error instanceof ApolloError
    || error instanceof AuthenticationError
    || error instanceof UserInputError
    || get(error, ['extensions', 'exception', 'name'], false) === 'AuthorizationError'
  ) {
    return error;
  }

  if (process.env.NODE_ENV !== 'development') {
    console.error(error);
  }

  return new Error('Something went wrong.');
}

function onConnect(params, ws, context) {
  const { request: { headers: { cookie: rawCookies } } } = context;

  const { JWT_PAYLOAD, JWT_SIGNATURE } = cookie.parse(rawCookies);

  return {
    user: verifyAndUnpack(JWT_PAYLOAD, JWT_SIGNATURE),
  };
}

function withGraphql(app, partialContext) {
  const typeDefs = mergeTypes([
    ...(fileLoader(SCHEMAS_GLOB)),
    ...(fileLoader(DIRECTIVES_SCHEMA_GLOB)),
  ]);

  const resolvers = mergeResolvers([
    ...(fileLoader(RESOLVERS_GLOB)),
  ]);

  const schemaDirectives = {
    ...(mergeResolvers([
      ...(fileLoader(DIRECTIVES_CLASS_GLOB)),
    ])),
    isAuthenticated: IsAuthenticatedDirective,
  };

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    subscriptions: {
      onConnect,
    },
    context: createContext(partialContext),
    formatError,
    playground: process.env.NODE_ENV === 'development' && {
      settings: {
        'request.credentials': 'include',
      },
    },
  });

  apollo.applyMiddleware({
    app,
    cors: false,
  });

  const httpServer = http.createServer(app);

  apollo.installSubscriptionHandlers(httpServer);

  return httpServer;
}

module.exports = withGraphql;
