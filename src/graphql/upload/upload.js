const yup = require('yup');
const validate = require('../../services/validate');
const { uploadFile: uploadToS3, getFileUrl } = require('../../services/aws');

async function fetchFileUrl(parent) {
  const { fileName } = parent;

  return getFileUrl(fileName);
}

async function fetchOwner(parent, args, context) {
  const { userId } = parent;
  const { database, user } = context;

  if (user.id !== userId) {
    return null;
  }

  return database.user.findByPk(user.id);
}

const FILE_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});

async function file(parent, args, context) {
  await validate(FILE_SCHEMA, args);

  const { database, user } = context;
  const { id } = args;

  return database.userUpload.findOne({
    where: {
      id,
      userId: user.id,
    },
  });
}

async function files(parent, args, context) {
  const { database, user } = context;

  return database.userUpload.findAll({
    where: {
      userId: user.id,
    },
  });
}

async function uploadFile(parent, args, context) {
  const upload = await args.file;

  const { database, user } = context;
  const fileName = await uploadToS3(upload.createReadStream(), user.id);

  const userUpload = await database.userUpload.create({
    userId: user.id,
    fileName,
  });

  return userUpload;
}


const DELETE_FILE_SCHEMA = yup.object().strict().shape({
  id: yup.string().required(),
});


async function deleteFile(parent, args, context) {
  await validate(DELETE_FILE_SCHEMA, args);

  const { database, user } = context;
  const { id } = args;

  await database.userUpload.destroy({
    where: {
      id,
      userId: user.id,
    },
  });

  return true;
}

module.exports = {
  File: {
    url: fetchFileUrl,
    owner: fetchOwner,
  },

  Query: {
    file,
    files,
  },

  Mutation: {
    uploadFile,
    deleteFile,
  },
};
