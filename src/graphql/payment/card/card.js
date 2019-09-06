const yup = require('yup');
const cpfCheck = require('cpf-check');
const { emitToken } = require('../../../services/auth');
const validate = require('../../../services/validate');


async function listCards(parent, args, context) {
  const { database, payment, user } = context;

  const client = await payment();

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });

  const cards = await client.cards.all({ customer_id: userPagarme.pagarmeUserId });

  return cards.map((card) => ({
    id: card.id,
    brand: card.brand,
    holderName: card.holder_name,
    lastDigits: card.last_digits,
    valid: card.valid,
  }));
}


const CREATE_CARD_SCHEMA = yup.object().strict().shape({
  hash: yup.string().required(),
  cpf: yup.string().test('cpf', '', (cpf) => cpfCheck.validate(cpf)).required(),
  phone: yup.string().test('phone', '', (phone) => /^\+?[1-9]\d{4,14}$/.test(phone)),
});

async function createCard(parent, args, context) {
  await validate(CREATE_CARD_SCHEMA, args);

  const {
    database,
    payment,
    res,
    user,
  } = context;
  const { hash, phone, cpf } = args;

  const client = await payment();

  const userPagarme = await database.userPagarme.findOne({
    where: {
      userId: user.id,
    },
  });


  let customerId = userPagarme && userPagarme.pagarmeUserId;

  if (!userPagarme) {
    const { id } = await client.customers.create({
      name: user.name,
      email: user.email,
      external_id: user.id,
      type: 'individual',
      country: 'br',
      phone_numbers: [
        phone,
      ],
      documents: [{
        type: 'cpf',
        number: cpf,
      }],
    });


    await database.userPagarme.create({
      userId: user.id,
      pagarmeUserId: id,
    });

    customerId = id;
  }

  const card = await client.cards.create({
    card_hash: hash,
    customer_id: customerId,
  });

  emitToken(res, {
    ...user,
    paymentId: customerId,
  });

  return {
    id: card.id,
    brand: card.brand,
    holderName: card.holder_hane,
    lastDigits: card.last_digits,
    valid: card.valid,
  };
}

module.exports = {
  Query: {
    listCards,
  },
  Mutation: {
    createCard,
  },
};
