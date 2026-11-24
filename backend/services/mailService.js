const axios = require('axios');

exports.sendVerificationCode = async (to, code) => {
  const apiKey = process.env.BREVO_API_KEY;

  // No key yet: print the code in the terminal so you can still test.
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Email service is not configured'); e.status = 503; throw e;
    }
    console.log(`\n[DEV MODE] Verification code for ${to}: ${code}\nSet BREVO_API_KEY in .env to send real emails.\n`);
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    const e = new Error('BREVO_SENDER_EMAIL is not set in backend/.env'); e.status = 503; throw e;
  }

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: process.env.BREVO_SENDER_NAME || 'Wanderly', email: senderEmail },
        to: [{ email: to }],
        subject: 'Your Wanderly verification code',
        textContent: `Your Wanderly verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px"><h2 style="color:#0A5C64">Wanderly</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p style="color:#666">It expires in 10 minutes. If you did not request it, ignore this email.</p></div>`,
      },
      { headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' }, timeout: 15000 }
    );
  } catch (err) {
    console.error('Brevo send failed:', err.response?.data || err.message);
    const e = new Error('Could not send the verification email. Check your Brevo settings in backend/.env.');
    e.status = 502;
    throw e;
  }
};