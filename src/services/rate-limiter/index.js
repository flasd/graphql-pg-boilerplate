const redis = require('redis');
const { ApolloError } = require('apollo-server-express');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { defaultKeyGenerator } = require('graphql-rate-limit-directive');

function keyGenerator(directiveArgs, obj, args, context, info) {
  return `${context.ip}:${defaultKeyGenerator(directiveArgs, obj, args, context, info)}`;
}

function onLimit(resource) {
  throw new ApolloError(
    `429:${Math.round(resource.msBeforeNext / 1000 / 60)}`,
  );
}

module.exports = {
  keyGenerator,
  onLimit,
};

if (process.env.NODE_ENV === 'production') {
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    enable_offline_queue: false,
  });

  redisClient.on('error', (error) => {
    console.error(error);
  });

  module.exports = {
    ...module.exports,
    limiterClass: RateLimiterRedis,
    limiterOptions: {
      storeClient: redisClient,
    },
  };
}
