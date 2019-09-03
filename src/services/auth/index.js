const jsonWebToken = require('jsonwebtoken');

function verifyAndUnpack(jwtPayload, jwtSignature) {
  if (!jwtPayload || !jwtSignature) {
    return [{}, null];
  }

  const JWT_TOKEN = `${jwtPayload}.${jwtSignature}`;

  try {
    const decoded = jsonWebToken.verify(JWT_TOKEN, process.env.JWT_SECRET);

    return [{
      ...decoded,
    }, JWT_TOKEN];
  } catch (error) {
    return [{}, null];
  }
}

function emitToken(res, user) {
  const token = jsonWebToken.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: `${parseInt(process.env.JWT_LIFETIME, 10)} seconds`,
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
}

function resetToken(res) {
  res.cookie('JWT_PAYLOAD', '', {
    maxAge: 0,
  });

  res.cookie('JWT_SIGNATURE', '', {
    httpOnly: true,
    maxAge: 0,
    secure: process.env.NODE_ENV !== 'development',
  });
}

module.exports = {
  verifyAndUnpack,
  emitToken,
  resetToken,
};
