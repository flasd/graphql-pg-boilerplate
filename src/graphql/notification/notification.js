const yup = require('yup');
const { negate, isNil, pickBy } = require('lodash');
const { ApolloError } = require('apollo-server-express');
const validate = require('../../services/validate');
const { messaging } = require('../../services/firebase');
const { getFileUrl } = require('../../services/aws');

function removeFalsy(obj) {
  return pickBy(obj, negate(isNil));
}

async function fetchUser(parent, args, context) {
  const { database } = context;
  const { userId } = parent;

  return database.user.findByPk(userId);
}

async function fetchTopic(parent, args, context) {
  const { database } = context;
  const { topicId } = parent;

  return database.notificationTopic.findByPk(topicId);
}

function createFileResolver(columnName) {
  return async function fetchFile(parent, args, context) {
    const { database } = context;
    const { [columnName]: fileId } = parent;

    return database.userUpload.findByPk(fileId);
  };
}

const LIST_NOTIFICATION_SCHEMA = yup.object().strict().shape({
  topicId: yup.string(),
  userId: yup.string(),
});

async function listNotifications(parent, args, context) {
  await validate(LIST_NOTIFICATION_SCHEMA, args);

  const { database } = context;
  const { topicId, userId } = args;

  return database.notification.findAll({
    where: removeFalsy({
      topicId,
      userId,
    }),
  });
}

const GET_NOTIFICATION_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function getNotification(parent, args, context) {
  await validate(GET_NOTIFICATION_SCHEMA);

  const { database } = context;
  const { id } = args;

  return database.notification.findByPk(id);
}

const SEND_NOTIFICATION_SCHEMA = yup.object().strict().shape({
  input: yup.object().strict().shape({
    title: yup.string().min(3).max(95).required(),
    body: yup.string().min(3).max(140).required(),
    action: yup.string().url().required(),
    priority: yup.bool().required(),
    color: yup.string().test('cor', '', (value) => (value ? /^#[A-Fa-f0-9]{6}$/.test(value) : true)),
    data: yup.object(),
    icon: yup.string().url(),
    image: yup.string().url(),
  }).required(),
  targets: yup.array().of(yup.string().required()).max(100).required(),
});

async function sendNotification(parent, args, context) {
  await validate(SEND_NOTIFICATION_SCHEMA, args);


  const { input, targets } = args;
  const { database } = context;

  const topicsSnapshot = await database.notificationTopic.findAll();
  const topics = topicsSnapshot.map((topic) => topic.id);

  if (input.image) {
    const userUpload = await database.userUpload.findByPk(input.image);
    const url = getFileUrl(userUpload.fileName, 4320);

    input.image = url;
  }

  if (input.icon) {
    const userUpload = await database.userUpload.findByPk(input.image);
    const url = getFileUrl(userUpload.fileName, 4320);

    input.image = url;
  }

  const notification = removeFalsy({
    data: input.data || undefined,
    notification: removeFalsy({
      badge: '1',
      title: input.title,
      body: input.body,
      color: input.color,
      clickAction: input.action,
      icon: input.icon,
      // image: input.image,
    }),

    // android: removeFalsy({
    //   data: input.data || undefined,
    //   notification: removeFalsy({
    //     title: input.title,
    //     body: input.body,
    //     click_action: input.action,
    //     icon: input.icon,
    //     color: input.color,
    //     notification_priority: input.priority ? 'PRIORITY_MAX' : 'PRIORITY_HIGH',
    //     visibility: 'PUBLIC',
    //     image: input.image,
    //     light_settings: {
    //       color: {
    //         red: input.color ? parseInt(input.color.substr(1, 2), 16) : 255,
    //         green: input.color ? parseInt(input.color.substr(3, 2), 16) : 255,
    //         blue: input.color ? parseInt(input.color.substr(5, 2), 16) : 255,
    //         alpha: 1,
    //       },
    //     },
    //   }),
    // }),

    // webpush: removeFalsy({
    //   data: input.data || undefined,
    //   notification: removeFalsy({
    //     title: input.title,
    //     body: input.body,
    //     icon: input.icon,
    //     color: input.color,
    //   }),

    //   fcm_options: {
    //     link: input.action,
    //   },
    // }),

    // apns: removeFalsy({
    //   payload: removeFalsy({
    //     title: input.title,
    //     body: input.body,
    //   }),

    //   fcm_options: removeFalsy({
    //     image: input.image,
    //   }),
    // }),
  });

  await Promise.all(
    targets.map(async (target) => {
      try {
        if (topics.includes(target)) {
          return messaging.sendToTopic(target, notification);
        }

        return messaging.sendToDevice(target, notification);
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );

  return true;
}


const SUBSCRIBE_TO_TOPIC_SCHEMA = yup.object().strict().shape({
  deviceId: yup.string().required(),
  topicId: yup.string().required(),
});

async function subscribeToTopic(parent, args, context) {
  await validate(SUBSCRIBE_TO_TOPIC_SCHEMA, args);

  const { database } = context;
  const { topicId, deviceId } = args;

  const notificationTopic = await database.notificationTopic.findByPk(topicId);

  if (!notificationTopic) {
    throw new ApolloError('Provided topic doesn\'t exist.');
  }

  await messaging.subscribeToTopic(deviceId, topicId);

  return true;
}

const CANCEL_SUBSCRIPTION_TO_TOPIC_SCHEMA = yup.object().strict().shape({
  deviceId: yup.string().required(),
  topicId: yup.string().required(),
});

async function cancelSubscriptionToTopic(parent, args) {
  await validate(CANCEL_SUBSCRIPTION_TO_TOPIC_SCHEMA, args);
  const { topicId, deviceId } = args;

  await messaging.unsubscribeFromTopic(deviceId, topicId);

  return true;
}

module.exports = {
  Notification: {
    target: fetchUser,
    topic: fetchTopic,
    icon: createFileResolver('icon'),
    image: createFileResolver('image'),
  },

  Query: {
    listNotifications,
    getNotification,
  },

  Mutation: {
    sendNotification,
    subscribeToTopic,
    cancelSubscriptionToTopic,
  },
};
