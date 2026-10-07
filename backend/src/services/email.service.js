const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

const LOGO_CANDIDATE_PATHS = [
  path.resolve(__dirname, '../../../public/Barangay Logo.png'),
  path.resolve(__dirname, '../../public/Barangay Logo.png'),
  path.resolve(__dirname, '../public/Barangay Logo.png'),
  path.resolve(__dirname, '../../../dist/admin-panel/browser/Barangay Logo.png'),
  path.resolve(__dirname, '../../../dist/online-portal/browser/Barangay Logo.png'),
  path.resolve(__dirname, '../../../dist/kiosk-app/browser/Barangay Logo.png'),
  path.resolve(process.cwd(), 'public/Barangay Logo.png'),
  path.resolve(process.cwd(), '../public/Barangay Logo.png'),
  path.resolve(process.cwd(), 'Barangay Logo.png')
];

let cachedLogoPath = undefined;
let cachedTransporter = null;

function getResolvedLogoPath() {
  if (cachedLogoPath !== undefined) {
    return cachedLogoPath;
  }
  for (const candidate of LOGO_CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(candidate)) {
        cachedLogoPath = candidate;
        return cachedLogoPath;
      }
    } catch {
      // ignore path access error
    }
  }
  cachedLogoPath = null;
  return null;
}

function getLogoAttachments() {
  const logoPath = getResolvedLogoPath();
  if (logoPath) {
    return [
      {
        filename: 'Barangay Logo.png',
        path: logoPath,
        cid: 'barangayLogo',
        contentType: 'image/png',
        contentDisposition: 'inline'
      }
    ];
  }
  return [];
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || config.smtp?.host;
  const user = process.env.SMTP_USER || config.smtp?.user;
  const pass = (process.env.SMTP_PASS || config.smtp?.pass || '').replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT || config.smtp?.port, 10) || 465;
  const secure = (process.env.SMTP_SECURE === 'true') || config.smtp?.secure || port === 465;

  if (host && user && pass) {
    try {
      cachedTransporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        dnsTimeout: 5000
      });
      return cachedTransporter;
    } catch (err) {
      console.error('[EMAIL SERVICE] Error initializing SMTP transporter:', err.message);
      return null;
    }
  }
  return null;
}

// Timeout helper to ensure email calls never hang or block server requests
function sendMailWithTimeout(transporter, mailOptions, timeoutMs = 8000) {
  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Executes an email task asynchronously in the background via setImmediate
 * to avoid blocking any HTTP response cycle or event loop.
 */
function sendBackground(taskPromiseOrFn, label = 'email') {
  setImmediate(async () => {
    try {
      if (typeof taskPromiseOrFn === 'function') {
        await taskPromiseOrFn();
      } else {
        await taskPromiseOrFn;
      }
    } catch (err) {
      console.error(`[EMAIL SERVICE] Background task (${label}) failed:`, err.message);
    }
  });
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
        .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .logo-img { display: block; width: 56px; height: 56px; max-width: 56px; border: 0; outline: none; text-decoration: none; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.2; }
        .sub-title { font-size: 12px; color: #ea580c; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        .code-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-val { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ea580c; margin: 0; font-family: monospace; }
        .expiry-note { font-size: 12px; color: #64748b; margin-top: 8px; }
        .info { font-size: 13px; color: #475569; line-height: 1.6; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: left;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="cid:barangayLogo" alt="Barangay San Manuel Seal" width="56" height="56" class="logo-img" />
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <h1 class="logo-title">Barangay San Manuel</h1>
                <p class="sub-title">IMS Document Request Services</p>
              </td>
            </tr>
          </table>
        </div>
        <p class="greeting">Hello <strong>${name || 'Administrator'}</strong>,</p>
        <p class="info">We received a request to reset your password for your Barangay San Manuel Admin account. Use the one-time verification code below to proceed with setting your new password:</p>
        
        <div class="code-box">
          <div class="code-val">${code}</div>
          <div class="expiry-note">This code will expire in <strong>${expiresMinutes} minutes</strong>.</div>
        </div>

        <p class="info">If you did not request this password reset, please ignore this email or contact your head system administrator immediately.</p>

        <div class="footer">
          <p>Barangay San Manuel Information Management System &bull; Bulacan City </p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const info = await sendMailWithTimeout(mailTransporter, {
        from: config.smtp.from,
        to: email,
        subject: `Password Reset Verification Code: ${code} - Barangay San Manuel IMS`,
        text: `Your password reset verification code is: ${code}. It expires in ${expiresMinutes} minutes.`,
        html: htmlContent,
        attachments: getLogoAttachments()
      }, 8000);
      console.log(`[EMAIL SERVICE] Verification code sent to ${email} (MessageID: ${info?.messageId || 'OK'})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] SMTP delivery failed to ${email}:`, err.message);
      console.log(`[EMAIL SERVICE (FALLBACK)] Verification Code for ${email}: ${code}`);
      return { success: true, mode: 'fallback' };
    }
  } else {
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
        .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .logo-img { display: block; width: 56px; height: 56px; max-width: 56px; border: 0; outline: none; text-decoration: none; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.2; }
        .sub-title { font-size: 12px; color: #ea580c; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px; }
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
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: left;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="cid:barangayLogo" alt="Barangay San Manuel Seal" width="56" height="56" class="logo-img" />
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <h1 class="logo-title">Barangay San Manuel</h1>
                <p class="sub-title">IMS Document Request Services</p>
              </td>
            </tr>
          </table>
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
          <p>Barangay San Manuel Information Management System &bull; Bulacan City</p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const info = await sendMailWithTimeout(mailTransporter, {
        from: config.smtp.from,
        to: email,
        subject: `Admin Login Verification Code: ${code} - Barangay San Manuel IMS`,
        text: `Your login verification code is: ${code}. It expires in ${expiresMinutes} minutes.`,
        html: htmlContent,
        attachments: getLogoAttachments()
      }, 8000);
      console.log(`[EMAIL SERVICE] Login verification code sent to ${email} (MessageID: ${info?.messageId || 'OK'})`);
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

const sendPortalCredentials = async ({ email, name, accountId, temporaryPassword, portalUrl = '' }) => {
  const mailTransporter = getTransporter();
  const loginUrl = portalUrl ? `${portalUrl.replace(/\/$/, '')}/login` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .logo-img { display: block; width: 56px; height: 56px; max-width: 56px; border: 0; outline: none; text-decoration: none; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.2; }
        .sub-title { font-size: 12px; color: #ea580c; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        .cred-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .cred-row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; font-size: 14px; }
        .cred-label { color: #64748b; font-weight: 600; }
        .cred-val { font-family: monospace; font-weight: 800; color: #0f172a; font-size: 16px; }
        .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 12px; color: #991b1b; line-height: 1.5; }
        .info { font-size: 13px; color: #475569; line-height: 1.6; }
        .cta { display: inline-block; margin-top: 16px; padding: 10px 18px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: left;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="cid:barangayLogo" alt="Barangay San Manuel Seal" width="56" height="56" class="logo-img" />
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <h1 class="logo-title">Barangay San Manuel</h1>
                <p class="sub-title">Online Portal Account</p>
              </td>
            </tr>
          </table>
        </div>
        <p class="greeting">Hello <strong>${name || 'Resident'}</strong>,</p>
        <p class="info">Your Barangay San Manuel Online Portal account has been created. Use the credentials below to sign in:</p>

        <div class="cred-box">
          <div class="cred-row">
            <span class="cred-label">Account ID</span>
            <span class="cred-val">${accountId}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Temporary Password</span>
            <span class="cred-val">${temporaryPassword}</span>
          </div>
        </div>

        <div class="warning-box">
          <strong>Security Notice:</strong> For security purposes, you are required to change your temporary password when you first log in. Never share these credentials with anyone.
        </div>

        <p class="info">Sign in with your Account ID and temporary password, then create your own password.</p>
        ${loginUrl ? `<p style="text-align:center;"><a class="cta" href="${loginUrl}">Open Online Portal</a></p>` : ''}

        <div class="footer">
          <p>Barangay San Manuel Information Management System &bull; Bulacan City</p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = 'Barangay San Manuel Online Portal Account';
  const text = `Your Online Portal account has been created.\n\nAccount ID: ${accountId}\nTemporary Password: ${temporaryPassword}\n\nYou must change this temporary password on first login.${loginUrl ? `\n\nPortal: ${loginUrl}` : ''}`;

  if (mailTransporter) {
    try {
      const info = await sendMailWithTimeout(mailTransporter, {
        from: config.smtp.from,
        to: email,
        subject,
        text,
        html: htmlContent,
        attachments: getLogoAttachments()
      }, 8000);
      console.log(`[EMAIL SERVICE] Portal credentials sent to ${email} (MessageID: ${info?.messageId || 'OK'})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] SMTP delivery failed to ${email}:`, err.message);
      console.log(`[EMAIL SERVICE (FALLBACK)] Portal credentials for ${email}: Account ID ${accountId}, Temp Password ${temporaryPassword}`);
      return { success: true, mode: 'fallback' };
    }
  }

  console.log(`=======================================================`);
  console.log(`[EMAIL SERVICE (DEV MODE)] Portal Account Credentials`);
  console.log(`Recipient: ${name || 'Resident'} <${email}>`);
  console.log(`Account ID: ${accountId}`);
  console.log(`Temporary Password: ${temporaryPassword}`);
  console.log(`=======================================================`);
  return { success: true, mode: 'dev' };
};

const sendContactUsMessage = async ({ fullName, email, phoneNumber, subject, message }) => {
  const mailTransporter = getTransporter();
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'full', timeStyle: 'short' });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #ea580c; padding: 24px; color: #ffffff; }
        .body { padding: 28px 24px; }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .msg-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .footer { padding: 16px 24px; background: #f1f5f9; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="cid:barangayLogo" alt="Logo" width="48" height="48" style="display:block; border-radius: 50%;" />
              </td>
              <td style="vertical-align: middle;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">Barangay San Manuel</h2>
                <p style="margin: 2px 0 0; font-size: 12px; opacity: 0.9;">Online Portal &bull; Resident Inquiry</p>
              </td>
            </tr>
          </table>
        </div>
        <div class="body">
          <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 0;">New Contact Form Message Received</p>
          <div class="field">
            <div class="label">Sender Name</div>
            <div class="val">${fullName || 'Anonymous'}</div>
          </div>
          <div class="field">
            <div class="label">Email Address</div>
            <div class="val"><a href="mailto:${email}" style="color:#ea580c;">${email}</a></div>
          </div>
          ${phoneNumber ? `<div class="field"><div class="label">Contact Number</div><div class="val">${phoneNumber}</div></div>` : ''}
          <div class="field">
            <div class="label">Subject</div>
            <div class="val">${subject || 'General Inquiry'}</div>
          </div>
          <div class="field">
            <div class="label">Date Submitted</div>
            <div class="val">${dateStr}</div>
          </div>
          <div class="label">Message</div>
          <div class="msg-box">${message}</div>
        </div>
        <div class="footer">
          Barangay San Manuel Online Portal &bull; City of San Jose del Monte, Bulacan
        </div>
      </div>
    </body>
    </html>
  `;

  const emailSubject = `[Inquiry] ${subject || 'Contact Form Submission'} - ${fullName}`;
  const textContent = `New Contact Form Submission\n\nFrom: ${fullName} (${email})\nPhone: ${phoneNumber || 'N/A'}\nSubject: ${subject}\nDate: ${dateStr}\n\nMessage:\n${message}`;

  const adminEmail = process.env.BARANGAY_CONTACT_EMAIL || config.smtp?.user || 'andreinrera@gmail.com';

  if (mailTransporter) {
    try {
      await sendMailWithTimeout(mailTransporter, {
        from: config.smtp.from,
        to: adminEmail,
        replyTo: email,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
        attachments: getLogoAttachments()
      }, 8000);
      console.log(`[EMAIL SERVICE] Contact form message sent to ${adminEmail} from ${email}`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Contact form SMTP delivery error:`, err.message);
      return { success: true, mode: 'fallback' };
    }
  }

  console.log(`=======================================================`);
  console.log(`[EMAIL SERVICE (DEV MODE)] Contact Form Submission`);
  console.log(`From: ${fullName} <${email}>`);
  console.log(`Phone: ${phoneNumber || '—'}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message:\n${message}`);
  console.log(`=======================================================`);
  return { success: true, mode: 'dev' };
};

const sendReadyForReleaseNotification = async ({
  email,
  name,
  requestNumber,
  serviceName,
  fee = 0,
  isIdRequest = false,
  claimLocation = 'Barangay San Manuel Hall, San Manuel, City of San Jose del Monte, Bulacan',
  officeHours = 'Monday – Friday, 8:00 AM – 5:00 PM',
  portalUrl = ''
}) => {
  const mailTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .logo-img { display: block; width: 56px; height: 56px; max-width: 56px; border: 0; outline: none; text-decoration: none; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.2; }
        .sub-title { font-size: 12px; color: #ea580c; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        
        .status-badge { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; }
        
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .info-label { color: #64748b; font-weight: 600; }
        .info-val { font-weight: 700; color: #0f172a; text-align: right; }
        
        .claim-box { background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .claim-title { font-size: 13px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .claim-list { margin: 0; padding-left: 20px; font-size: 13px; color: #7c2d12; line-height: 1.6; }
        .claim-list li { margin-bottom: 4px; }
        
        .info-text { font-size: 13px; color: #475569; line-height: 1.6; }
        .cta { display: inline-block; margin-top: 12px; padding: 10px 20px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: left;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="cid:barangayLogo" alt="Barangay San Manuel Seal" width="56" height="56" class="logo-img" />
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <h1 class="logo-title">Barangay San Manuel</h1>
                <p class="sub-title">IMS Document Request Services</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <span class="status-badge">&#10003; Ready for Release</span>
        </div>

        <p class="greeting">Hello <strong>${name || 'Resident'}</strong>,</p>
        
        <p class="info-text">
          Good news! Your request for <strong>${serviceName}</strong> has been processed and is now <strong>Ready for Release</strong>.
          ${isIdRequest 
            ? 'You may now proceed to Barangay San Manuel Hall for physical card issuance / RFID card registration.' 
            : 'You may now claim your official document at Barangay San Manuel Hall during office hours.'}
        </p>

        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Request Reference #</span>
            <span class="info-val" style="font-family: monospace; font-size: 14px; color: #ea580c;">${requestNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Service / Document</span>
            <span class="info-val">${serviceName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-val" style="color: #15803d;">Ready for Release</span>
          </div>
          <div class="info-row">
            <span class="info-label">Processing Fee</span>
            <span class="info-val">${fee > 0 ? '₱' + Number(fee).toFixed(2) : 'FREE'}</span>
          </div>
        </div>

        <div class="claim-box">
          <div class="claim-title">Claiming Instructions</div>
          <ul class="claim-list">
            <li><strong>Location:</strong> ${claimLocation}</li>
            <li><strong>Office Hours:</strong> ${officeHours}</li>
            <li><strong>What to Bring:</strong>
              <ul style="margin-top: 4px; padding-left: 16px;">
                <li>Valid Government-issued ID or Student ID</li>
                <li>Your Request Reference Number (<strong>${requestNumber}</strong>)</li>
                ${fee > 0 ? `<li>Exact processing fee of <strong>₱${Number(fee).toFixed(2)}</strong></li>` : ''}
                ${isIdRequest ? '<li>If Renewal/Replacement: Bring your previous Barangay ID card</li>' : ''}
              </ul>
            </li>
          </ul>
        </div>

        <div class="footer">
          <p>Barangay San Manuel Information Management System &bull; Bulacan City</p>
          <p>This is an automated system notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `Ready for Release: ${serviceName} (${requestNumber}) - Barangay San Manuel`;
  const text = `Hello ${name || 'Resident'},\n\nYour request for ${serviceName} (${requestNumber}) is now READY FOR RELEASE.\n\nClaim Location: ${claimLocation}\nOffice Hours: ${officeHours}\n\nPlease bring a valid ID and reference number ${requestNumber}.\n\nBarangay San Manuel IMS`;

  if (mailTransporter) {
    try {
      const info = await sendMailWithTimeout(mailTransporter, {
        from: config.smtp.from,
        to: email,
        subject,
        text,
        html: htmlContent,
        attachments: getLogoAttachments()
      }, 8000);
      console.log(`[EMAIL SERVICE] Ready for Release notification sent to ${email} (MessageID: ${info?.messageId || 'OK'})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Ready for Release SMTP delivery failed to ${email}:`, err.message);
      console.log(`[EMAIL SERVICE (FALLBACK)] Ready for Release for ${email}: Request ${requestNumber} (${serviceName})`);
      return { success: true, mode: 'fallback' };
    }
  }

  console.log(`=======================================================`);
  console.log(`[EMAIL SERVICE (DEV MODE)] Ready for Release Notification`);
  console.log(`Recipient: ${name || 'Resident'} <${email}>`);
  console.log(`Request #: ${requestNumber}`);
  console.log(`Service: ${serviceName}`);
  console.log(`Status: Ready for Release`);
  console.log(`=======================================================`);
  return { success: true, mode: 'dev' };
};

// Asynchronous background wrappers that return immediately without blocking callers
const sendReadyForReleaseNotificationAsync = (params) => {
  sendBackground(() => sendReadyForReleaseNotification(params), `ReadyForRelease:${params.requestNumber || params.email}`);
  return Promise.resolve({ success: true, mode: 'queued' });
};

const sendPortalCredentialsAsync = (params) => {
  sendBackground(() => sendPortalCredentials(params), `PortalCredentials:${params.accountId || params.email}`);
  return Promise.resolve({ success: true, mode: 'queued' });
};

const sendContactUsMessageAsync = (params) => {
  sendBackground(() => sendContactUsMessage(params), `ContactInquiry:${params.email}`);
  return Promise.resolve({ success: true, mode: 'queued' });
};

const sendVerificationCodeAsync = (params) => {
  sendBackground(() => sendVerificationCode(params), `VerificationCode:${params.email}`);
  return Promise.resolve({ success: true, mode: 'queued' });
};

const sendLoginVerificationCodeAsync = (params) => {
  sendBackground(() => sendLoginVerificationCode(params), `LoginOtp:${params.email}`);
  return Promise.resolve({ success: true, mode: 'queued' });
};

module.exports = {
  sendVerificationCode,
  sendLoginVerificationCode,
  sendPortalCredentials,
  sendContactUsMessage,
  sendReadyForReleaseNotification,
  // Asynchronous non-blocking dispatchers
  sendReadyForReleaseNotificationAsync,
  sendPortalCredentialsAsync,
  sendContactUsMessageAsync,
  sendVerificationCodeAsync,
  sendLoginVerificationCodeAsync,
  sendBackground
};
