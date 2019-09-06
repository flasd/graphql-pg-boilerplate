const yup = require('yup');
const { get } = require('lodash');
const { ApolloError } = require('apollo-server-express');
const validate = require('../../../services/validate');

const GET_PURCHASE_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function getPurchase(parent, args, context) {
  await validate(GET_PURCHASE_SCHEMA, args);

  const { database, payment, user } = context;
  const { id } = args;

  const client = await payment();

  const transaction = await client.transactions.find({ id });

  const pagarmeUserId = get(transaction, ['customer', 'id']);

  if (!pagarmeUserId) {
    throw new Error(`getPurchase ${id} failed to bring customer`);
  }

  const userExists = await database.userPagarme.findOne({
    where: {
      userId: user.id,
      pagarmeUserId: `${pagarmeUserId}`,
    },
  });

  if (!userExists) {
    throw new ApolloError('User doesn\'t own this transaction.');
  }

  return {
    ...transaction,
    refundedValue: transaction.refunded_amount,
    createdAt: transaction.date_created,
    updatedAt: transaction.date_updated,
  };
}

async function listPurchases(parent, args, context) {
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

  const transactions = await client.transactions.all({
    customer: {
      id: userPagarme.pagarmeUserId,
    },
  });

  return transactions.map((transaction) => ({
    ...transaction,
    refundedValue: transaction.refunded_amount,
    createdAt: transaction.date_created,
    updatedAt: transaction.date_updated,
  }));
}

const CREATE_CHARGE_SCHEMA = yup.object().strict().shape({
  charge: yup.object().strict().shape({
    product: yup.string().required(),
    quantity: yup.number().min(1).required(),
    installments: yup.number().integer(),
  }),
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

async function purchaseProduct(parent, args, context) {
  await validate(CREATE_CHARGE_SCHEMA, args);

  const { database, payment, user } = context;
  const {
    charge: { product: productId, quantity, installments },
    card: { id: cardId, cvv },
    address,
  } = args;

  const client = await payment();

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  const customer = await client.customers.find({ id: userPagarme.pagarmeUserId });

  const customerAddress = {
    zipcode: address.zipcode,
    neighborhood: address.neighborhood,
    street: address.street,
    street_number: address.streetNumber,
    state: address.state,
    city: address.city,
    country: 'br',
  };

  const product = await database.product.findByPk(productId);

  const transaction = await client.transactions.create({
    address: customerAddress,
    amount: product.unitPrice * quantity,
    async: false,
    capture: JSON.parse(process.env.PAGARME_AUTO_CAPTURE),
    installments: installments || 1,
    payment_method: 'credit_card',
    soft_descriptor: product.name,
    card_id: cardId,
    card_cvv: cvv,

    customer: {
      id: customer.id,
    },

    billing: {
      name: customer.name,
      address: customerAddress,
    },

    items: [{
      quantity,
      id: product.id,
      title: product.name,
      unit_price: product.unitPrice,
      tangible: product.tangible,
    }],
  });

  if (transaction && transaction.status !== 'paid' && transaction.status !== 'authorized') {
    console.error(new TypeError(`Transaction ${transaction.id} not payed.`));
    console.info(JSON.stringify(transaction, null, 2));
  }

  return {
    ...transaction,
    refundedValue: transaction.refunded_amount,
    createdAt: transaction.date_created,
    updatedAt: transaction.date_updated,
  };
}

const REFUND_PURCHASE_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function refundPurchase(parent, args, context) {
  await validate(REFUND_PURCHASE_SCHEMA, args);

  const { database, payment, user } = context;
  const { id } = args;

  const client = await payment();

  const transaction = await client.transactions.find({ id });

  const pagarmeUserId = get(transaction, ['customer', 'id']);

  const userExists = await database.userPagarme.findOne({
    where: {
      userId: user.id,
      pagarmeUserId: `${pagarmeUserId}`,
    },
  });

  if (!userExists) {
    throw new ApolloError('User doesn\'t own this transaction.');
  }

  await client.transactions.refund({ id });

  return true;
}


module.exports = {
  Query: {
    getPurchase,
    listPurchases,
  },
  Mutation: {
    purchaseProduct,
    refundPurchase,
  },
};
