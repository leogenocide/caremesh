import nodemailer from 'nodemailer';

let transporter = null;

export function getMailerTransporter() {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? 'smtp.gmail.com' : null);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure,
      auth: { user, pass }
    });
  }

  return transporter;
}

export async function sendVerificationEmail(toEmail, code) {
  const mailer = getMailerTransporter();
  const from = process.env.SMTP_FROM || `"CareMesh Community" <${process.env.SMTP_USER || 'no-reply@caremesh.org'}>`;

  if (!mailer) {
    console.warn(`\n⚠️  [MAILER NOT CONFIGURED] Real email could not be dispatched because SMTP_USER and SMTP_PASS are not configured.`);
    console.warn(`👉 To send real verification emails to inboxes, set SMTP_USER & SMTP_PASS (e.g. Gmail address & 16-character App Password) in your .env or Render dashboard.`);
    console.log(`[AUTH] Registration email verification code for ${toEmail}: ${code}\n`);
    return { sent: false, reason: 'unconfigured' };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to: toEmail,
      subject: `Your CareMesh Verification Code: ${code}`,
      text: `Welcome to CareMesh!\n\nYour 6-digit email verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this message.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0284c7; margin: 0; font-size: 24px;">CareMesh</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Community Resilience & Mutual Aid Network</p>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Welcome! Enter the following code to verify your email address and activate your account:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #0284c7; border-radius: 8px; display: inline-block; font-family: monospace;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">This code is valid for <strong>15 minutes</strong>.</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            If you did not attempt to create an account on CareMesh, you can safely ignore this email.
          </p>
        </div>
      `
    });

    console.log(`[MAILER] Real verification email successfully dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER ERROR] Failed to deliver verification email to ${toEmail}:`, err.message);
    console.log(`[AUTH] Registration email verification code for ${toEmail}: ${code}`);
    return { sent: false, error: err.message };
  }
}

export async function sendPasswordResetEmail(toEmail, code) {
  const mailer = getMailerTransporter();
  const from = process.env.SMTP_FROM || `"CareMesh Security" <${process.env.SMTP_USER || 'no-reply@caremesh.org'}>`;

  if (!mailer) {
    console.warn(`\n⚠️  [MAILER NOT CONFIGURED] Real email could not be dispatched because SMTP_USER and SMTP_PASS are not configured.`);
    console.log(`[AUTH] Password reset code for ${toEmail}: ${code}\n`);
    return { sent: false, reason: 'unconfigured' };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to: toEmail,
      subject: `Your CareMesh Password Reset Code: ${code}`,
      text: `Your CareMesh 6-digit password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please secure your account immediately.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0284c7; margin: 0; font-size: 24px;">CareMesh</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Password Reset Request</p>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Use the following code to reset your password:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #0284c7; border-radius: 8px; display: inline-block; font-family: monospace;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">This code is valid for <strong>15 minutes</strong>.</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
      `
    });

    console.log(`[MAILER] Real password reset email successfully dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER ERROR] Failed to deliver password reset email to ${toEmail}:`, err.message);
    console.log(`[AUTH] Password reset code for ${toEmail}: ${code}`);
    return { sent: false, error: err.message };
  }
}
