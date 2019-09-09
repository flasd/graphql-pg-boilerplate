const AWS = require('aws-sdk');
const streamToBuffer = require('stream-to-buffer');
const sha1 = require('sha1');
const fileType = require('file-type');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

async function getBuffer(fileStream) {
  return new Promise((resolve, reject) => {
    streamToBuffer(fileStream, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(buffer);
    });
  });
}

async function uploadFile(file, fileName, fileMime) {
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Body: file,
      Key: fileName,
      ContentType: fileMime,
    }, (err, fileData) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(fileData);
    });
  });
}

async function deleteFile(filename) {
  return new Promise((resolve, reject) => {
    s3.deleteObject({
      Bucket: process.env.AWS_BUCKET,
      Key: filename,
    }, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}


async function upload(fileStream, ownerId) {
  const file = await getBuffer(fileStream);
  const fileHash = sha1(file);
  const fileMetadata = fileType(file);
  const fileName = `uploads/${ownerId}/${fileHash}.${fileMetadata.ext}`;
  const fileMime = fileMetadata.mime;

  await uploadFile(file, fileName, fileMime);

  return fileName;
}

async function removeFile(fileName) {
  return deleteFile(fileName);
}

async function getFileUrl(fileName, expires) {
  return s3.getSignedUrlPromise('getObject', {
    Expires: expires || 30,
    Bucket: process.env.AWS_BUCKET,
    Key: fileName,
  });
}

function createFileCleanerMiddleware({ database }) {
  return async (req, res) => {
    const { headers: { 'X-Cron-Key': xCronKey } } = req;

    if (xCronKey !== process.env.FILE_CRON_ACCESS_KEY) {
      res.status(401).send('No no no');
      return;
    }

    const deletedFiles = await database.userUpload.findAll({
      where: {
        [database.Sequelize.Op.ne]: null,
      },
    });

    const errors = [];

    await Promise.all(
      deletedFiles.map(async (userUpload) => {
        try {
          await removeFile(userUpload.fileName);
        } catch (error) {
          errors.push(userUpload.id);
        }
      }),
    );

    await database.userUpload.update({
      deleteFailed: true,
    }, {
      where: {
        id: {
          [database.Sequelize.Op.in]: errors,
        },
      },
    });

    req.status(200).send('Done!');
  };
}

module.exports = {
  uploadFile: upload,
  deleteFile: removeFile,
  getFileUrl,
  createFileCleanerMiddleware,
};
