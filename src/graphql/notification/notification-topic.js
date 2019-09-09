const yup = require('yup');
const validate = require('../../services/validate');


async function listTopics(parent, args, context) {
  const { database } = context;

  return database.notificationTopic.findAll();
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
  Query: {
    listTopics,
    getTopic,
  },

  Mutation: {
    createTopic,
    deleteTopic,
  },
};
