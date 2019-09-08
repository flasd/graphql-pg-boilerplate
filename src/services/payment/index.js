/* eslint-disable camelcase */
const pagarme = require('pagarme');
const { IpFilter } = require('express-ipfilter');
const bodyParser = require('body-parser');

const pagarmeIpAddresses = [
  '13.248.138.86',
  '76.223.11.124',
];


async function getPaymentClient() {
  return pagarme.client.connect({ api_key: process.env.PAGARME_API_KEY });
}

const filter = IpFilter(pagarmeIpAddresses, { mode: 'allow' });

async function validatePostback(req, res, next) {
  try {
    const {
      body,
      headers: {
        'x-hub-signature': xHubSignature,
      },
    } = req;

    const signature = pagarme.postback.calculateSignature(
      xHubSignature,
      body,
    );

    const isValid = pagarme.postback.verifySignature(
      xHubSignature,
      body,
      signature,
    );

    if (isValid) {
      next();
      return;
    }

    res.status(401).send('Can you double check your signature, sir?');
  } catch (error) {
    res.status(400).send('Bad! Bad request!');
  }
}

function createPostbackHandler({ database }) {
  return [
    filter,
    bodyParser.text(),
    validatePostback,
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
      const {
        body: {
          current_status,
          object,
          payload,
        },
      } = req;

      if (object !== 'subscription') {
        res.status(400).send(`Expected subscription postback but got ${object}`);
        return;
      }

      const subscription = await database.userSubscription.findOne({
        where: {
          userId: payload.customer.external_id,
          subscriptionId: payload.id,
          subscriptionEnd: payload.current_period_end,
        },
      });

      if (subscription) {
        if (current_status !== 'paid') {
          subscription.update({
            subscriptionEnd: new Date().toISOString(),
          });
        }

        return;
      }

      if (current_status !== 'paid') {
        console.error(new Error('Postback with unpayed not existing subscription!'));
        console.info(JSON.stringify(payload, null, 2));
        return;
      }

      await database.userSubscription.create({
        userId: payload.customer.external_id,
        subscriptionId: payload.id,
        subscriptionEnd: payload.current_period_end,
      });
    },
  ];
}

module.exports = {
  payment: getPaymentClient,
  createPostbackHandler,
};
