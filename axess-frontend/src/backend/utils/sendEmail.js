// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',                    // ← or 'sendgrid', 'brevo', etc
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,   // ← App Password, NOT normal password
    },
  });
};

const sendApprovalEmail = async (toEmail, fullName, role = 'user') => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"aXess Team" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your aXess Account Has Been Approved',
    html: `
      <h2>Hello ${fullName},</h2>
      <p>Great news! Your account has been <strong>approved</strong>.</p>
      <p>You can now log in and start using aXess:</p>
      <p style="margin: 24px 0;">
        <a href="https://your-domain.com/login" 
           style="background:#6366f1; color:white; padding:12px 24px; border-radius:8px; text-decoration:none;">
          Log in now
        </a>
      </p>
      <p>Your role: <strong>${role}</strong></p>
      <p style="color:#6b7280; font-size:14px; margin-top:32px;">
        — aXess Team
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${toEmail}`);
  } catch (err) {
    console.error(`Failed to send approval email to ${toEmail}:`, err.message);
    // Do **not** throw — we don't want to fail the whole request
  }
};

const sendRejectionEmail = async (toEmail, fullName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"aXess Team" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Update Regarding Your aXess Membership',
    html: `
      <h2>Hello ${fullName},</h2>
      <p>After review, we regret to inform you that your membership application has been <strong>rejected</strong>.</p>
      <p>Common reasons include:</p>
      <ul>
        <li>Incomplete or unclear documents</li>
        <li>Verification could not be confirmed</li>
      </ul>
      <p>You are welcome to re-apply after addressing the issues.</p>
      <p style="color:#6b7280; font-size:14px; margin-top:32px;">
        If you believe this was a mistake, feel free to contact support.
      </p>
      <p style="margin-top:24px;">— aXess Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent to ${toEmail}`);
  } catch (err) {
    console.error(`Failed to send rejection email to ${toEmail}:`, err.message);
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
};