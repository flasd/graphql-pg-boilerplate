function author(parent, args, context) {
  const { id } = args;
  const { database } = context;

  return database.author.findByPk(id);
}

async function createAuthor(parent, args, context) {
  const { name } = args;
  const { database } = context;

  return database.author.create({ name });
}

module.exports = {
  Query: {
    author,
  },

  Mutation: {
    createAuthor,
  },
};
