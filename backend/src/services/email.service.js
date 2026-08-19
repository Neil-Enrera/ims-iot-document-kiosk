const nodemailer = require('nodemailer');
const config = require('../config/environment');

function getTransporter() {
  const host = process.env.SMTP_HOST || config.smtp?.host;
  const user = process.env.SMTP_USER || config.smtp?.user;
  const pass = (process.env.SMTP_PASS || config.smtp?.pass || '').replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT || config.smtp?.port, 10) || 465;
  const secure = (process.env.SMTP_SECURE === 'true') || config.smtp?.secure || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }
  return null;
}

const sendVerificationCode = async ({ email, name, code, expiresMinutes = 10 }) => {
  const mailTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
        .sub-title { font-size: 13px; color: #ea580c; font-weight: 600; text-transform: uppercase; margin: 4px 0 0 0; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        .code-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-val { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ea580c; margin: 0; font-family: monospace; }
        .expiry-note { font-size: 12px; color: #64748b; margin-top: 8px; }
        .info { font-size: 13px; color: #475569; line-height: 1.6; }
        .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo-title">Barangay San Manuel</h1>
          <p class="sub-title">IMS Document Request Services</p>
        </div>
        <p class="greeting">Hello <strong>${name || 'Administrator'}</strong>,</p>
        <p class="info">We received a request to reset your password for your Barangay San Manuel Admin account. Use the one-time verification code below to proceed with setting your new password:</p>
        
        <div class="code-box">
          <div class="code-val">${code}</div>
          <div class="expiry-note">This code will expire in <strong>${expiresMinutes} minutes</strong>.</div>
        </div>

        <p class="info">If you did not request this password reset, please ignore this email or contact your head system administrator immediately.</p>

        <div class="footer">
          <p>Barangay San Manuel Information Management System &bull; Tarlac City</p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: `Password Reset Verification Code: ${code} - Barangay San Manuel IMS`,
        text: `Your password reset verification code is: ${code}. It expires in ${expiresMinutes} minutes.`,
        html: htmlContent
      });
      console.log(`[EMAIL SERVICE] Verification code sent to ${email} (MessageID: ${info.messageId})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] SMTP delivery failed to ${email}:`, err.message);
      // Fallback log for development
      console.log(`[EMAIL SERVICE (FALLBACK)] Verification Code for ${email}: ${code}`);
      return { success: true, mode: 'fallback' };
    }
  } else {
    // Development mode log
    console.log(`=======================================================`);
    console.log(`[EMAIL SERVICE (DEV MODE)] Verification Code for ${email}`);
    console.log(`Recipient: ${name || 'Administrator'} <${email}>`);
    console.log(`Code: [ ${code} ] (Expires in ${expiresMinutes} minutes)`);
    console.log(`=======================================================`);
    return { success: true, mode: 'dev' };
  }
};

const sendLoginVerificationCode = async ({ email, name, code, expiresMinutes = 10 }) => {
  const mailTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
        .sub-title { font-size: 13px; color: #ea580c; font-weight: 600; text-transform: uppercase; margin: 4px 0 0 0; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        .code-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-val { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ea580c; margin: 0; font-family: monospace; }
        .expiry-note { font-size: 12px; color: #64748b; margin-top: 8px; }
        .info { font-size: 13px; color: #475569; line-height: 1.6; }
        .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #991b1b; line-height: 1.5; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo-title">Barangay San Manuel</h1>
          <p class="sub-title">IMS Document Request Services</p>
        </div>
        <p class="greeting">Hello <strong>${name || 'Administrator'}</strong>,</p>
        <p class="info">A login attempt was initiated for your Barangay San Manuel Admin account. Use the one-time verification code below to complete your sign-in:</p>
        
        <div class="code-box">
          <div class="code-val">${code}</div>
          <div class="expiry-note">This code will expire in <strong>${expiresMinutes} minutes</strong>.</div>
        </div>

        <div class="warning-box">
          <strong>Security Notice:</strong> Never share this verification code with anyone. Barangay personnel will never ask for your code.
        </div>

        <div class="footer">
          <p>Barangay San Manuel Information Management System &bull; Tarlac City</p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: `Admin Login Verification Code: ${code} - Barangay San Manuel IMS`,
        text: `Your login verification code is: ${code}. It expires in ${expiresMinutes} minutes.`,
        html: htmlContent
      });
      console.log(`[EMAIL SERVICE] Login verification code sent to ${email} (MessageID: ${info.messageId})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] SMTP delivery failed to ${email}:`, err.message);
      console.log(`[EMAIL SERVICE (FALLBACK)] Login Verification Code for ${email}: ${code}`);
      return { success: true, mode: 'fallback' };
    }
  } else {
    console.log(`=======================================================`);
    console.log(`[EMAIL SERVICE (DEV MODE)] Login Verification Code for ${email}`);
    console.log(`Recipient: ${name || 'Administrator'} <${email}>`);
    console.log(`Code: [ ${code} ] (Expires in ${expiresMinutes} minutes)`);
    console.log(`=======================================================`);
    return { success: true, mode: 'dev' };
  }
};

module.exports = { sendVerificationCode, sendLoginVerificationCode };
