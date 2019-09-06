const yup = require('yup');
const { negate, isNil, pickBy } = require('lodash');
const validate = require('../../../services/validate');

function removeFalsy(obj) {
  return pickBy(obj, negate(isNil));
}

const GET_PRODUCT_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function getProduct(parent, args, context) {
  await validate(GET_PRODUCT_SCHEMA, args);

  const { database } = context;
  const { id } = args;

  return database.product.findByPk(id);
}

async function listProducts(parent, args, context) {
  const { database } = context;

  return database.product.findAll();
}


const CREATE_PRODUCT_SCHEMA = yup.object().strict().shape({
  name: yup.string().min(3).max(127).required(),
  unitPrice: yup
    .number()
    .integer()
    .min(1)
    .max(JSON.parse(process.env.PAGARME_MAX_SAFE_PURCHASE))
    .required(),
  tangible: yup.boolean().required(),
});

async function createProduct(parent, args, context) {
  await validate(CREATE_PRODUCT_SCHEMA, args.input);

  const { database } = context;
  const { name, unitPrice, tangible } = args.input;

  return database.product.create({
    name,
    unitPrice,
    tangible,
  });
}

const UPDATE_PRODUCT_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
  name: yup.string().min(3).max(127),
  unitPrice: yup
    .number()
    .integer()
    .min(1)
    .max(JSON.parse(process.env.PAGARME_MAX_SAFE_PURCHASE)),
  tangible: yup.boolean(),
});

async function updateProduct(parent, args, context) {
  await validate(UPDATE_PRODUCT_SCHEMA, args.input);

  const { database } = context;
  const {
    id, name, unitPrice, tangible,
  } = args;

  const product = await database.product.findByPk(id);

  return product.update(removeFalsy({
    name,
    unitPrice,
    tangible,
  }));
}

const DELETE_PRODUCT_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function deleteProduct(parent, args, context) {
  await validate(DELETE_PRODUCT_SCHEMA, args);

  const { database } = context;
  const { id } = args;

  await database.product.destroy({
    where: {
      id,
    },
  });

  return true;
}


module.exports = {
  Query: {
    getProduct,
    listProducts,
  },

  Mutation: {
    createProduct,
    updateProduct,
    deleteProduct,
  },
};
