const { verifyAndUnpack } = require('../../services/auth');

async function authMiddleware(req, res, next) {
  const { JWT_PAYLOAD, JWT_SIGNATURE } = req.cookies;

  const [user, JWT_TOKEN] = verifyAndUnpack(JWT_PAYLOAD, JWT_SIGNATURE);

  req.user = user;
  req.headers.Authorization = `Bearer ${JWT_TOKEN}`;

  next();
}

module.exports = authMiddleware;
