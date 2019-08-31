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

module.exports = {
  verifyAndUnpack,
};
