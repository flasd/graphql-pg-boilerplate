const sendgrid = require('@sendgrid/mail');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const EMAILS = {
  EMAIL_VERIFICATION: {
    templateId: process.env.EMAIL_CONFIRMATION_TEMPLATE_ID,
  },

  PASSWORD_RECOVERY: {
    templateId: process.env.PASSWORD_RECOVERY_TEMPLATE_ID,
  },
};

async function send(email, to, variables) {
  try {
    await sendgrid.send({
      to,
      from: process.env.EMAIL_FROM,
      templateId: email.templateId,
      dynamic_template_data: {
        ...variables,
        appUrl: `${process.env.FRONTEND_URL}`,
        appName: `${process.env.APP_NAME}`,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

send.EMAILS = EMAILS;

module.exports = send;
