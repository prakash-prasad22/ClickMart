const env = require('../config/env');

/**
 * SMS gateway abstraction. Plug in your provider here.
 * Default `console` provider prints the OTP to the server log (development).
 */
async function sendSms(phone, message) {
  switch (env.SMS_PROVIDER) {
    case 'msg91': {
      // https://docs.msg91.com — flow API with DLT template
      const res = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { authkey: env.SMS_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({
          template_id: env.SMS_TEMPLATE_ID,
          sender: env.SMS_SENDER_ID,
          recipients: [{ mobiles: phone.replace('+', ''), message }],
        }),
      });
      if (!res.ok) throw new Error(`MSG91 error ${res.status}`);
      return;
    }
    case 'twilio': {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ To: phone, From: env.TWILIO_FROM_NUMBER, Body: message }),
        }
      );
      if (!res.ok) throw new Error(`Twilio error ${res.status}`);
      return;
    }
    default:
      console.log(`📱 [SMS → ${phone}] ${message}`);
  }
}

function normalizePhone(raw = '') {
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits)) return `${env.DEFAULT_COUNTRY_CODE}${digits}`;
  if (/^0\d{10}$/.test(digits)) return `${env.DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  return null;
}

module.exports = { sendSms, normalizePhone };
