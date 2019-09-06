const yup = require('yup');
const { get } = require('lodash');
const { ApolloError } = require('apollo-server-express');
const { negate, isNil, pickBy } = require('lodash');
const validate = require('../../../services/validate');

function removeFalsy(obj) {
  return pickBy(obj, negate(isNil));
}

async function fetchTransactions(parent, args, context) {
  const { id } = parent;
  const { payment } = context;

  const client = await payment();

  const transactions = await client.subscriptions.findTransactions({
    id,
  });

  return transactions.map((transaction) => ({
    ...transaction,
    refundedValue: transaction.refunded_amount,
    createdAt: transaction.date_created,
    updatedAt: transaction.date_updated,
  }));
}


const GET_SUBSCRIPTION_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function getSubscription(parent, args, context) {
  await validate(GET_SUBSCRIPTION_SCHEMA, args);

  const { database, payment, user } = context;
  const { id } = args;

  const client = await payment();

  const subscription = await client.subscriptions.find({ id });

  const pagarmeUserId = get(subscription, ['customer', 'id']);

  if (!pagarmeUserId) {
    throw new Error(`getSubscription ${id} failed to bring customer`);
  }

  const userExists = await database.userPagarme.findOne({
    where: {
      userId: user.id,
      pagarmeUserId,
    },
  });

  if (!userExists) {
    throw new ApolloError('User doesn\'t own this subscription.');
  }

  return {
    id: subscription.id,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      amount: subscription.plan.amount,
      recurrence: subscription.plan.recurrence,
      installments: subscription.plan.installments,
      trial: subscription.plan.trial_days,
    },
    card: {
      id: subscription.card.id,
      brand: subscription.card.brand,
      holderName: subscription.card.holder_name,
      lastDigits: subscription.card.last_digits,
      valid: subscription.card.valid,
    },
  };
}


async function listSubscriptions(parent, args, context) {
  const { database, payment, user } = context;

  const client = await payment();

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  if (!userPagarme) {
    throw new ApolloError('User not found.');
  }

  const subscriptions = await client.subscriptions.all({
    customer_id: userPagarme.pagarmeUserId,
  });

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      amount: subscription.plan.amount,
      recurrence: subscription.plan.recurrence,
      installments: subscription.plan.installments,
      trial: subscription.plan.trial_days,
    },
    card: {
      id: subscription.card.id,
      brand: subscription.card.brand,
      holderName: subscription.card.holder_name,
      lastDigits: subscription.card.last_digits,
      valid: subscription.card.valid,
    },
  }));
}

const SUBSCRIBE_SCHEMA = yup.object().strict().shape({
  planId: yup.string().required(),
  card: yup.object().strict().shape({
    id: yup.string().required(),
    cvv: yup.string().length(3).required(),
  }).required(),
  address: yup.object().strict().shape({
    zipcode: yup.string().length(8).required(),
    neighborhood: yup.string().min(6).max(128).required(),
    street: yup.string().min(3).max(128),
    streetNumber: yup.string().min(1).max(12).required(),
    state: yup.string().length(2).required(),
  }).required(),
});

async function subscribe(parent, args, context) {
  await validate(SUBSCRIBE_SCHEMA, args);

  const { database, payment, user } = context;
  const { planId, card: { id: cardId, cvv }, address } = args;

  const client = await payment();

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  const customer = await client.customers.find({ id: userPagarme.pagarmeUserId });

  const subscription = await client.subscriptions.create({
    async: false,
    plan_id: planId,
    card_id: cardId,
    card_cvv: cvv,
    customer: {
      id: userPagarme.pagarmeUserId,
      email: user.email,
      name: customer.name,
      document_number: customer.documents[0].number,
      address: {
        zipcode: address.zipcode,
        neighborhood: address.neighborhood,
        street: address.street,
        street_number: address.streetNumber,
      },
    },
  });

  if (subscription.status !== 'paid' && subscription.status !== 'authorized') {
    console.error(new TypeError(`Subscription ${subscription.id} payment failed.`));
    console.info(JSON.stringify(subscription, null, 2));
  } else {
    await database.userSubscription.create({
      userId: user.id,
      subscriptionId: subscription.id,
      subscriptionEnd: subscription.current_period_end,
    });
  }

  return {
    id: subscription.id,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      amount: subscription.plan.amount,
      recurrence: subscription.plan.recurrence,
      installments: subscription.plan.installments,
      trial: subscription.plan.trial_days,
    },
    card: {
      id: subscription.card.id,
      brand: subscription.card.brand,
      holderName: subscription.card.holder_name,
      lastDigits: subscription.card.last_digits,
      valid: subscription.card.valid,
    },
  };
}

const UPDATE_SUBSCRIPTION_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
  plan: yup.string(),
  card: yup.string(),
});

async function updateSubscription(parent, args, context) {
  await validate(UPDATE_SUBSCRIPTION_SCHEMA, args.input);

  const { database, payment, user } = context;
  const { id, plan, card } = args.input;

  const client = await payment();

  const subscription = await client.subscriptions.find({ id });

  const pagarmeUserId = get(subscription, ['customer', 'id']);

  if (!pagarmeUserId) {
    throw new Error(`updateSubscription ${id} failed to bring customer`);
  }

  const userExists = await database.userPagarme.findOne({
    where: {
      userId: user.id,
      pagarmeUserId: `${pagarmeUserId}`,
    },
  });

  if (!userExists) {
    throw new ApolloError('User doesn\'t own this subscription.');
  }

  const updatedSubscription = await client.subscriptions.update(removeFalsy({
    id,
    plan: plan ? { id: plan } : false,
    card: card ? { id: card } : false,
  }));

  return {
    id: updatedSubscription.id,
    plan: {
      id: updatedSubscription.plan.id,
      name: updatedSubscription.plan.name,
      amount: updatedSubscription.plan.amount,
      recurrence: updatedSubscription.plan.recurrence,
      installments: updatedSubscription.plan.installments,
      trial: updatedSubscription.plan.trial_days,
    },
    card: {
      id: updatedSubscription.card.id,
      brand: updatedSubscription.card.brand,
      holderName: updatedSubscription.card.holder_name,
      lastDigits: updatedSubscription.card.last_digits,
      valid: updatedSubscription.card.valid,
    },
  };
}

const CANCEL_SUBSCRIPTION = yup.object().strict().shape({
  id: yup.string().required(),
});

async function cancelSubscription(parent, args, context) {
  await validate(CANCEL_SUBSCRIPTION, args);

  const { database, payment, user } = context;
  const { id } = args;

  const client = await payment();

  const subscription = await client.subscriptions.find({ id });

  const pagarmeUserId = get(subscription, ['customer', 'id']);

  if (!pagarmeUserId) {
    throw new Error(`cancelSubscription ${id} failed to bring customer`);
  }

  const userExists = await database.userPagarme.findOne({
    where: {
      userId: user.id,
      pagarmeUserId: `${pagarmeUserId}`,
    },
  });

  if (!userExists) {
    throw new ApolloError('User doesn\'t own this subscription.');
  }

  await client.subscriptions.cancel({ id });

  return true;
}

module.exports = {
  Subscription: {
    transactions: fetchTransactions,
  },

  Query: {
    getSubscription,
    listSubscriptions,
  },

  Mutation: {
    subscribe,
    updateSubscription,
    cancelSubscription,
  },
};
