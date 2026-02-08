const twilio = require('twilio');

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    const error = new Error('Twilio credentials are not configured.');
    error.status = 500;
    throw error;
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function sendSms({ to, body }) {
  const { TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_FROM_NUMBER) {
    const error = new Error('Twilio from number is not configured.');
    error.status = 500;
    throw error;
  }
  const client = getTwilioClient();
  return client.messages.create({
    from: TWILIO_FROM_NUMBER,
    to,
    body,
  });
}

module.exports = {
  sendSms,
};
