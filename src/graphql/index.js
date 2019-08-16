const path = require('path');
const { fileLoader, mergeTypes, mergeResolvers } = require('merge-graphql-schemas');
const { ApolloServer } = require('apollo-server-express');
const { IsAuthenticatedDirective, HasRoleDirective, HasScopeDirective } = require('graphql-auth-directives');

const SCHEMAS_GLOB = path.join(__dirname, './**/*.schema.gql');
const RESOLVERS_GLOB = path.join(__dirname, './**/*.js');
const DIRECTIVES_SCHEMA_GLOB = path.join(__dirname, './**/*.directive.gql');
const DIRECTIVES_CLASS_GLOB = path.join(__dirname, './**/*.directive.js');

function createContext(partialContext = {}) {
  return ({ req, res }) => {
    // get JWT parts from cookies
    const { JWT_PAYLOAD, JWT_SIGNATURE } = req.cookies;

    // graph-auth-directives uses a header object.
    const headers = {
      Authorization: `${JWT_PAYLOAD}.${JWT_SIGNATURE}`,
    };

    return {
      req,
      res,
      headers,
      ...partialContext,
    };
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
    hasRole: HasRoleDirective,
    hasScope: HasScopeDirective,
  };

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    context: createContext(partialContext),
    playground: process.env.NODE_ENV === 'development' && {
      settings: {
        'request.credentials': 'include',
      },
    },
  });

  return apollo.applyMiddleware({
    app,
    cors: false,
    disableHealthCheck: true,
  });
}

module.exports = withGraphql;
