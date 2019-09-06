const yup = require('yup');
const { negate, isNil, pickBy } = require('lodash');
const validate = require('../../../services/validate');

function removeFalsy(obj) {
  return pickBy(obj, negate(isNil));
}

async function listPlans(parent, args, context) {
  const { payment } = context;

  const client = await payment();

  const plans = await client.plans.find();

  return plans.map((plan) => ({ ...plan, trial: plan.trial_days }));
}


const CREATE_PLAN_SCHEMA = yup.object().strict().shape({
  name: yup.string().min(3).max(32).required(),
  amount: yup.number().integer().min(100).max(JSON.parse(process.env.PAGARME_MAX_SAFE_PURCHASE))
    .required(),
  recurrence: yup.string().oneOf(['monthly', 'bimonthly', 'quarterly', 'semesterly', 'annually']),
  installments: yup.number().integer(),
  trial: yup.number().integer().min(1).max(30),
});

function getRecurrence(recurrenceString) {
  switch (recurrenceString) {
    case 'monthly':
      return 30;

    case 'bimonthly':
      return 60;

    case 'quarterly':
      return 90;

    case 'semesterly':
      return 180;

    case 'annually':
      return 365;

    default:
      throw new Error(`Recurrence ${recurrenceString} not found.`);
  }
}

async function createPlan(parent, args, context) {
  await validate(CREATE_PLAN_SCHEMA, args.input);

  const { payment } = context;

  const {
    input: {
      name,
      amount,
      recurrence: recurrenceString,
      installments,
      trial,
    },
  } = args;

  const recurrence = getRecurrence(recurrenceString);
  const client = await payment();

  const { id: planId } = await client.plans.create(removeFalsy({
    name,
    amount,
    installments: installments || null,
    days: recurrence,
    trial_days: trial || null,
    payment_methods: ['credit_card'],
  }));

  return {
    id: planId,
    name,
    trial,
  };
}

const UPDATE_PLAN_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
  name: yup.string().min(3).max(32).required(),
  trial: yup.number().integer().min(1).max(30),
});

async function updatePlan(parent, args, context) {
  await validate(UPDATE_PLAN_SCHEMA, args.input);

  const { payment } = context;

  const {
    input: {
      id,
      name,
      trial,
    },
  } = args;

  const client = await payment();

  await client.plans.update({
    id,
    name,
    trial,
  });

  return {
    id,
    name,
    trial,
  };
}

module.exports = {
  Query: {
    listPlans,
  },

  Mutation: {
    createPlan,
    updatePlan,
  },
};
