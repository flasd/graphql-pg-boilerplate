const path = require('path');
const http = require('http');
const { get } = require('lodash');
const { decode } = require('fetch-auth-manager');
const { fileLoader, mergeTypes, mergeResolvers } = require('merge-graphql-schemas');
const { IsAuthenticatedDirective } = require('graphql-auth-directives');
const {
  ApolloServer, ApolloError, AuthenticationError, UserInputError,
} = require('apollo-server-express');

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

function onConnect(params) {
  const { Authorization } = params;

  return {
    user: decode(Authorization),
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

  const uploads = {
    maxFieldSize: JSON.parse(process.env.MAX_FILE_SIZE),
    maxFiles: 1,
  };

  const playground = process.env.NODE_ENV === 'development' && {
    settings: {
      'request.credentials': 'include',
    },
  };

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    subscriptions: { onConnect },
    context: createContext(partialContext),
    formatError,
    uploads,
    playground,
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
