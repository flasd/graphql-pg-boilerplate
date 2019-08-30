const yup = require('yup');
const { UserInputError } = require('apollo-server-express');

function customValidation(ref, fn, message = '') {
  return this.test({
    name: 'customValidation',
    exclusive: false,
    message,
    params: {
      reference: ref.path,
    },
    test(value) {
      return fn(value, this.resolve(ref));
    },
  });
}

yup.addMethod(yup.string, 'customValidation', customValidation);

async function validate(schema, args) {
  const isValid = await schema.validate(args);

  if (!isValid) {
    throw new UserInputError('Invalid arguments.');
  }
}

module.exports = validate;
