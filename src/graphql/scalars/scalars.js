const { resolvers } = require('graphql-scalars');

delete resolvers.UnsignedFloat;
delete resolvers.UnsignedInt;
delete resolvers.BigInt;

module.exports = {
  ...resolvers,
};
