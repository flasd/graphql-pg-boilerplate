const jsonWebToken = require('jsonwebtoken');
const yup = require('yup');
const { ApolloError } = require('apollo-server-express');
const validate = require('../../services/validate');


async function currentUser(parent, args, context) {
  const { database, user } = context;

  return database.user.findByPk(user.id);
}


const CREATE_ACCOUNT_SCHEMA = yup.object().strict().shape({
  name: yup.string().min(3).max(127).required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).max(255).required(),
});

async function createAccount(parent, args, context) {
  await validate(CREATE_ACCOUNT_SCHEMA, args.input);

  const { database } = context;
  const { name, email, password } = args.input;

  await database.user.create({
    name,
    email,
    password,
  });

  return true;
}


const LOGIN_SCHEMA = yup.object().strict().shape({
  email: yup.string().email().required(),
  password: yup.string().min(3).max(255).required(),
});

async function login(parent, args, context) {
  await validate(LOGIN_SCHEMA, args);

  const { email, password } = args;
  const { database, res } = context;

  const user = await database.user.findOne({
    where: {
      email,
    },
  });

  const error = new ApolloError(
    'Invalid password or User not found.',
    'x0001',
  );

  if (!user) {
    throw error;
  }

  if (!user.hasPassword(password, user.password)) {
    throw error;
  }

  const token = jsonWebToken.sign({
    id: user.id,
    email,
  }, process.env.JWT_SECRET).split('.');

  res.cookie('JWT_PAYLOAD', `${token[0]}.${token[1]}`, {
    maxAge: 1000 * 60 * 60 * 60,
  });

  res.cookie('JWT_SIGNATURE', token[2], {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });

  return true;
}


async function logout(parent, args, context) {
  const { res } = context;


  res.cookie('JWT_PAYLOAD', '', {
    maxAge: 0,
  });

  res.cookie('JWT_SIGNATURE', '', {
    httpOnly: true,
    maxAge: 0,
    secure: process.env.NODE_ENV !== 'development',
  });

  return true;
}

async function removeAccount(parent, args, context) {
  const { database, user: { id } } = context;

  const user = await database.user.findByPk(id);

  user.destroy();

  await logout(parent, args, context);

  return true;
}

module.exports = {
  Query: {
    currentUser,
  },
  Mutation: {
    createAccount,
    login,
    logout,
    removeAccount,
  },
};
