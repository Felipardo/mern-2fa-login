const nodemailer = require('nodemailer');
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASS:', process.env.GMAIL_APP_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS
  }
});

const send2FACode = async (to, code) => {
  const mailOptions = {
    from: `"Seguridad 2FA" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Tu código de autenticación 2FA',
    text: `Tu código de acceso es: ${code}`,
    html: `<p>Tu código de acceso es: <strong>${code}</strong></p>`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { send2FACode };
