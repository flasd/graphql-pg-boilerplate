// Express error handlers need to have 4 params
// eslint-disable-next-line no-unused-vars
async function errorHandler(err, req, res, next) {
  console.error(err);

  // the server is fine, but attackers can get excited and thats funny LOL.
  return res.status(err.statusCode || 500).send('here be dragons');
}

module.exports = errorHandler;
