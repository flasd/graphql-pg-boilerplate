const jsonWebToken = require('jsonwebtoken');

function login(parent, args, context) {
  const { name } = args;
  const { res } = context;

  const token = jsonWebToken.sign({
    name,
    role: 'creator',
  }, process.env.JWT_SECRET).split('.');

  res.cookie('JWT_PAYLOAD', `${token[0]}.${token[1]}`, {
    maxAge: 1000 * 60 * 60 * 60,
  });

  res.cookie('JWT_SIGNATURE', token[2], {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });

  return {
    success: true,
  };
}

module.exports = {
  Mutation: {
    login,
  },
};
