const yup = require('yup');
const { ApolloError } = require('apollo-server-express');
const srs = require('secure-random-string');
const { createToken, logout: resetToken } = require('fetch-auth-manager/server');
const validate = require('../../services/validate');
const sendEmail = require('../../services/email');
const { auth } = require('../../services/firebase');

async function fetchTokens(parent, args, context) {
  const { id } = parent;
  const { database } = context;

  const userTokens = await database.userToken.findAll({
    where: {
      userId: id,
    },
  });

  return userTokens.map((item) => item.dataValues.fcmToken);
}

async function currentUser(parent, args, context) {
  const { database, user } = context;

  return database.user.findByPk(user.id);
}


const LIST_USERS_SCHEMA = yup.object().strict().shape({
  page: yup.number().integer().min(0).required(),
  order: yup.string().oneOf(['asc', 'desc']).required(),
  filter: yup.object().strict().shape({
    name: yup.string(),
    photo: yup.bool(),
    emailVerified: yup.bool(),
    role: yup.string().oneOf(['admin', 'user']),
    source: yup.string().oneOf(['facebook', 'google', 'twitter', 'self']),
  }),
});

async function listUsers(parent, args, context) {
  await validate(LIST_USERS_SCHEMA, args);

  const { database } = context;

  const where = {};

  if (args.filter) {
    const {
      name, photo, emailVerified, role, source,
    } = args.filter;
    const { like, not, is } = database.Sequelize.Op;

    if (name) {
      where.name = {
        [like]: `%${name || ''}%`,
      };
    }

    if (typeof photo === 'boolean') {
      where.photo = {
        [photo ? not : is]: null,
      };
    }

    if (typeof emailVerified === 'boolean') {
      where.emailVerified = {
        [emailVerified ? is : not]: true,
      };
    }

    if (role) {
      where.role = role;
    }

    if (source) {
      where.source = source === 'self' ? source : `${source}.com`;
    }
  }

  return database.user.paginate({
    page: args.page,
    paginate: 25,
    order: [['name', `${args.order}`.toUpperCase()]],
    where,
  });
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

  await new Promise((resolve, reject) => {
    database.sequelize.transaction(async (t) => {
      try {
        let user;
        try {
          user = await database.user.create({
            name,
            email,
            password,
            role: 'user',
          }, { transaction: t });
        } catch (error) {
          throw new ApolloError('E-mail taken.', 'x0002');
        }

        const emailConfirmationToken = await database.emailConfirmationToken.create({
          userId: user.id,
          token: srs({ length: 32 }),
        }, { transaction: t });

        if (process.env.NODE_ENV === 'development') {
          console.info('Confirmation token: ', emailConfirmationToken.token);
        }

        sendEmail(
          sendEmail.EMAILS.EMAIL_VERIFICATION,
          user.email,
          {
            name: user.name,
            email: user.email,
            confirmUrl: `${
              process.env.FRONTEND_URL
            }/${
              process.env.FRONTEND_CONFIRM_EMAIL_PATH
            }/${emailConfirmationToken.token}`.replace(/\/{2,}/g, '/'),
            confirmToken: emailConfirmationToken.token,
          },
        );

        resolve();
      } catch (error) {
        reject(error);
      }
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

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  createToken(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    photo: user.photo,
    paymentId: userPagarme ? userPagarme.pagarmeUserId : undefined,
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
      resetUrl: `${
        process.env.FRONTEND_URL
      }/${
        process.env.FRONTEND_RESET_PASSWORD_PATH
      }/${passwordRecoveryToken.token}`.replace(/\/{2,}/g, '/'),
      passwordRecoveryToken: passwordRecoveryToken.token,
    },
  );

  return true;
}

const RECOVERY_TOKEN_EXISTS_SCHEMA = yup.object().strict().shape({
  recoveryToken: yup.string().length(32).required(),
});

async function recoveryTokenExists(parent, args, context) {
  await validate(RECOVERY_TOKEN_EXISTS_SCHEMA, args);

  const { database } = context;

  const passwordRecoveryToken = await database.passwordRecoveryToken.findOne({
    where: {
      token: args.recoveryToken,
    },
  });

  if (passwordRecoveryToken) {
    return true;
  }

  return false;
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

  resetToken(res);

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

const REMOVE_ACCOUNT_AS_ADMIN_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
  password: yup.string().min(6).max(255).required(),
});

async function removeAccountAsAdmin(parent, args, context) {
  await validate(REMOVE_ACCOUNT_AS_ADMIN_SCHEMA, args);

  const { database, user } = context;
  const { id, password } = args;

  const admin = await database.user.findByPk(user.id);

  if (!admin.hasPassword(password)) {
    throw new ApolloError('Invalid password.');
  }

  const target = await database.user.findByPk(id);


  if (!target) {
    throw new ApolloError('User not found.');
  }

  if (target.role === 'admin') {
    throw new ApolloError('Can\'t remove admin.');
  }

  await target.destroy();

  return true;
}

const CREATE_SOCIAL_ACCOUNT_SCHEMA = yup.object().strict().shape({
  firebaseIdToken: yup.string().required(),
});

async function createSocialAccount(parent, args, context) {
  await validate(CREATE_SOCIAL_ACCOUNT_SCHEMA, args);

  const { database } = context;
  const { firebaseIdToken } = args;

  const { uid, email } = await auth.verifyIdToken(firebaseIdToken);
  const user = await auth.getUser(uid);

  if (user.providerData.length === 0) {
    return false;
  }

  const [providerData] = user.providerData;

  const ownUser = await database.user.findOne({
    where: {
      email,
    },
  });

  if (ownUser) {
    await ownUser.update({
      photo: providerData.photoURL,
      emailVerified: true,
    });

    return false;
  }

  await database.user.create({
    name: providerData.displayName,
    photo: providerData.photoURL,
    source: providerData.providerId,
    email,
    emailVerified: true,
    password: srs(),
    role: 'user',
  });

  return true;
}

const SOCIAL_LOGIN_SCHEMA = yup.object().strict().shape({
  firebaseIdToken: yup.string().required(),
});

async function socialLogin(parent, args, context) {
  await validate(SOCIAL_LOGIN_SCHEMA, args);

  const { database, res } = context;
  const { firebaseIdToken } = args;

  const { email } = await auth.verifyIdToken(firebaseIdToken);

  const user = await database.user.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApolloError('User doesn\'t have an account.');
  }

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  createToken(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    photo: user.photo,
    emailVerified: user.emailVerified,
    paymentId: userPagarme ? userPagarme.pagarmeUserId : undefined,
  });

  return true;
}

const CHANGE_USER_ROLE_SCHEMA = yup.object().strict().shape({
  userId: yup.string().required(),
  role: yup.string().oneOf(['admin', 'user']).required(),
  password: yup.string().required(),
});

async function changeUserRole(parent, args, context) {
  await validate(CHANGE_USER_ROLE_SCHEMA, args);

  const { database, user: { id } } = context;
  const { userId, role, password } = args;

  if (userId === id) {
    throw new ApolloError('You cannot update your own permissions.');
  }

  const admin = await database.user.findByPk(id);

  if (!admin.hasPassword(password)) {
    throw new ApolloError('Wrong password.');
  }

  const user = await database.user.findByPk(userId);

  if (!user) {
    throw new ApolloError('User not found.');
  }

  await user.update({
    role,
  });

  return true;
}

async function sendPasswordRecoveryEmailAdmin(parent, args, context) {
  // this allows admins to bypass rate limiting
  return sendPasswordRecoveryEmail(parent, args, context);
}

module.exports = {
  User: {
    fcmTokens: fetchTokens,
  },

  Query: {
    currentUser,
    listUsers,
    recoveryTokenExists,
  },
  Mutation: {
    changeUserRole,
    confirmEmail,
    createAccount,
    createSocialAccount,
    login,
    logout,
    recoverPassword,
    removeAccount,
    removeAccountAsAdmin,
    sendPasswordRecoveryEmail,
    socialLogin,
    sendPasswordRecoveryEmailAdmin,
  },
};
