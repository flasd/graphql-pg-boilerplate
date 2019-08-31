const jsonWebToken = require('jsonwebtoken');
const yup = require('yup');
const { ApolloError } = require('apollo-server-express');
const srs = require('secure-random-string');
const validate = require('../../services/validate');
const sendEmail = require('../../services/email');


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

  await new Promise((resolve) => {
    database.sequelize.transaction(async (t) => {
      const user = await database.user.create({
        name,
        email,
        password,
      }, { transaction: t });

      const emailConfirmationToken = await database.emailConfirmationToken.create({
        userId: user.id,
        token: srs({ length: 32 }),
      }, { transaction: t });

      sendEmail(
        sendEmail.EMAILS.EMAIL_VERIFICATION,
        user.email,
        {
          name: user.name,
          email: user.email,
          emailConfirmationToken: emailConfirmationToken.token,
        },
      );

      resolve();
    });
  });

  return true;
}


const CONFIRM_EMAIL_SCHEMA = yup.object().strict().shape({
  confirmationToken: yup.string().length(32).required(),
});

async function confirmEmail(parent, args, context) {
  await validate(CONFIRM_EMAIL_SCHEMA, args);
  const { database } = context;

  await new Promise((resolve, reject) => {
    database.sequelize.transaction(async (t) => {
      await database.emailConfirmationToken.destroy({
        where: {
          createdAt: {
            [database.Sequelize.Op.lte]: new Date(
              Date.now() - (1000 * 60 * 60 * 24),
            ).toISOString(),
          },
        },
      }, { transaction: t });

      const emailConfirmationToken = await database.emailConfirmationToken.findOne({
        where: {
          token: args.confirmationToken,
        },
      }, { transaction: t });

      const error = new ApolloError('Token expired or not found.');

      if (!emailConfirmationToken) {
        reject(error);
        return;
      }

      const { userId } = emailConfirmationToken;

      const user = await database.user.findByPk(userId, { transaction: t });

      if (!user) {
        reject(error);
        return;
      }

      await user.update({
        emailVerified: true,
      }, { transaction: t });

      await emailConfirmationToken.destroy({}, { transaction: t });

      resolve();
    });
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

  const token = jsonWebToken.sign(
    {
      id: user.id,
      email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '60 hours',
    },
  ).split('.');

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

const SEND_PASSWORD_RECOVERY_EMAIL_SCHEMA = yup.object().strict().shape({
  email: yup.string().email().required(),
});

async function sendPasswordRecoveryEmail(parent, args, context) {
  await validate(SEND_PASSWORD_RECOVERY_EMAIL_SCHEMA, args);

  const { database } = context;

  const user = await database.user.findOne({
    where: {
      email: args.email,
    },
  });

  if (!user) {
    throw new ApolloError('User not found.');
  }

  const passwordRecoveryToken = await database.passwordRecoveryToken.create({
    userId: user.id,
    token: srs(32),
  });

  sendEmail(
    sendEmail.EMAILS.PASSWORD_RECOVERY,
    user.email,
    {
      name: user.name,
      email: user.email,
      passwordRecoveryToken: passwordRecoveryToken.token,
    },
  );

  return true;
}

const RECOVER_PASSWORD_SCHEMA = yup.object().strict().shape({
  recoveryToken: yup.string().length(32).required(),
  password: yup.string().min(6).max(255).required(),
});

async function recoverPassword(parent, args, context) {
  await validate(RECOVER_PASSWORD_SCHEMA, args);
  const { database } = context;

  await new Promise((resolve, reject) => {
    database.sequelize.transaction(async (t) => {
      await database.passwordRecoveryToken.destroy({
        where: {
          createdAt: {
            [database.Sequelize.Op.lte]: new Date(
              Date.now() - (1000 * 60 * 60 * 24),
            ).toISOString(),
          },
        },
      }, { transaction: t });

      const passwordRecoveryToken = await database.passwordRecoveryToken.findOne({
        where: {
          token: args.recoveryToken,
        },
      }, { transaction: t });

      const error = new ApolloError('Token expired or not found.');

      if (!passwordRecoveryToken) {
        reject(error);
        return;
      }

      const { userId } = passwordRecoveryToken;

      const user = await database.user.findByPk(userId, { transaction: t });

      if (!user) {
        reject(error);
        return;
      }

      await user.update({
        password: args.password,
      }, { transaction: t });

      await passwordRecoveryToken.destroy({}, { transaction: t });

      resolve();
    });
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

const REMOVE_ACCOUNT_SCHEMA = yup.object().strict().shape({
  password: yup.string().min(6).max(255).required(),
});

async function removeAccount(parent, args, context) {
  await validate(REMOVE_ACCOUNT_SCHEMA, args);

  const { database, user: { id } } = context;

  const user = await database.user.findByPk(id);

  if (!user.hasPassword(args.password)) {
    throw new ApolloError('Invalid password.');
  }

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
    confirmEmail,
    login,
    sendPasswordRecoveryEmail,
    recoverPassword,
    logout,
    removeAccount,
  },
};
