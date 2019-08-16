function Author(parent, args, context) {
  const { author_id: authorId } = parent;
  const { database } = context;

  return database.author.findByPk(authorId);
}

function posts(parent, args, context) {
  const { database } = context;

  return database.post.findAll();
}

function post(parent, args, context) {
  const { id } = args;
  const { database } = context;

  return database.post.findByPk(id);
}

function createPost(parent, args, context) {
  const { input } = args;
  const { database } = context;

  return database.post.create({
    title: input.title,
    body: input.body,
    author_id: input.author,
  });
}

module.exports = {
  Author,

  Query: {
    posts,
    post,
  },

  Mutation: {
    createPost,
  },
};
