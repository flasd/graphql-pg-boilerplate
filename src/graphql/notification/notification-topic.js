const yup = require('yup');
const { negate, isNil, pickBy } = require('lodash');
const validate = require('../../services/validate');

function removeFalsy(obj) {
  return pickBy(obj, negate(isNil));
}

async function deleteable(parent, args, context) {
  const { id } = parent;

  const { database } = context;

  const count = await database.notification.count({
    where: {
      topicId: id,
    },
  });

  return !count;
}

const LIST_TOPICS_SCHEMA = yup.object().strict().shape({
  name: yup.string().max(127),
});

async function listTopics(parent, args, context) {
  await validate(LIST_TOPICS_SCHEMA, args);

  const { database } = context;

  const where = removeFalsy({
    name: args.name ? {
      [database.Sequelize.Op.like]: `${args.name}%`,
    } : null,
  });

  const topics = await database.notificationTopic.findAll({
    where,
  });

  const total = await database.notificationTopic.count({
    where,
  });

  return {
    topics,
    total,
  };
}

const GET_TOPIC_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function getTopic(parent, args, context) {
  await validate(GET_TOPIC_SCHEMA, args);

  const { database } = context;
  const { id } = args;

  return database.notificationTopic.findByPk(id);
}

const CREATE_TOPIC_SCHEMA = yup.object().strict().shape({
  name: yup.string().max(127).required(),
});

async function createTopic(parent, args, context) {
  await validate(CREATE_TOPIC_SCHEMA, args);

  const { database } = context;
  const { name } = args;

  return database.notificationTopic.create({
    name,
  });
}

const DELETE_TOPIC_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function deleteTopic(parent, args, context) {
  await validate(DELETE_TOPIC_SCHEMA, args);

  const { database } = context;
  const { id } = args;

  await database.notificationTopic.destroy({
    where: {
      id,
    },
  });

  return true;
}

module.exports = {
  NotificationTopic: {
    deleteable,
  },

  Query: {
    listTopics,
    getTopic,
  },

  Mutation: {
    createTopic,
    deleteTopic,
  },
};
