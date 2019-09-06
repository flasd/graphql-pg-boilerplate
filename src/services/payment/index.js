const pagarme = require('pagarme');

async function getPaymentClient() {
  return pagarme.client.connect({ api_key: process.env.PAGARME_API_KEY });
}

module.exports = getPaymentClient;
