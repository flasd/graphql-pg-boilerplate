const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientId = process.env.FIREBASE_CLIENT_ID;
const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const credential = admin.credential.cert({
  type: 'service_account',
  project_id: projectId,
  private_key_id: privateKeyId,
  private_key: privateKey,
  client_email: `firebase-adminsdk-w3inu@${projectId}.iam.gserviceaccount.com`,
  client_id: clientId,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-w3inu%40${projectId}.iam.gserviceaccount.com`,
});

admin.initializeApp({
  credential,
  databaseURL: `https://${projectId}.firebaseio.com`,
});

module.exports = {
  messaging: admin.messaging(),
};
