const { verifyAndUnpack, emitToken } = require('../../services/auth');

async function authMiddleware(req, res, next) {
  const { JWT_PAYLOAD, JWT_SIGNATURE } = req.cookies;

  const [user, JWT_TOKEN] = verifyAndUnpack(JWT_PAYLOAD, JWT_SIGNATURE);

  const nowSeconds = Math.round(Date.now() / 1000);
  const jwtLifetime = parseInt(process.env.JWT_LIFETIME, 10);

  if (user.exp - nowSeconds < ((jwtLifetime / 3) * 2)) {
    emitToken(res, user);
  }

  req.user = user;
  req.headers.Authorization = `Bearer ${JWT_TOKEN}`;

  next();
}

module.exports = authMiddleware;
