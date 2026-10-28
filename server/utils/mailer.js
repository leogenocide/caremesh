import { google } from "googleapis";

let gmailClient = null;

function getGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const user = process.env.GMAIL_USER;

  if (!clientId || !clientSecret || !refreshToken || !user) {
    console.warn("[MAILER] Gmail API configuration is incomplete.", {
      clientIdPresent: Boolean(clientId),
      clientSecretPresent: Boolean(clientSecret),
      refreshTokenPresent: Boolean(refreshToken),
      gmailUserPresent: Boolean(user),
    });

    return null;
  }

  if (!gmailClient) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    gmailClient = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });
  }

  return gmailClient;
}

function getFromAddress(displayName = "CareMesh Community") {
  const user = process.env.GMAIL_USER;

  if (!user) {
    throw new Error("GMAIL_USER is not configured.");
  }

  const safeName = displayName.replace(/[\r\n"]/g, "");
  const configuredFrom = process.env.GMAIL_FROM;

  if (
    configuredFrom &&
    !configuredFrom.includes("\r") &&
    !configuredFrom.includes("\n") &&
    configuredFrom.includes("<") &&
    configuredFrom.includes(">")
  ) {
    return configuredFrom;
  }

  return `"${safeName}" <${user}>`;
}

function encodeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function encodeSubject(subject) {
  // RFC 2047 encoded-word format supports UTF-8 subjects.
  return `=?UTF-8?B?${encodeBase64(subject)}?=`;
}

function createRawMessage({ from, to, subject, text, html }) {
  const boundary = `caremesh_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;

  const safeTo = to.replace(/[\r\n]/g, "");
  const safeSubject = subject.replace(/[\r\n]/g, "");

  const message = [
    `From: ${from}`,
    `To: ${safeTo}`,
    `Subject: ${encodeSubject(safeSubject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBase64(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBase64(html),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  // Gmail API requires the complete message to be Base64URL-encoded.
  return Buffer.from(message, "utf8").toString("base64url");
}

async function sendEmail({ to, displayName, subject, text, html }) {
  const gmail = getGmailClient();

  if (!gmail) {
    return { sent: false, reason: "unconfigured" };
  }

  try {
    const raw = createRawMessage({
      from: getFromAddress(displayName),
      to,
      subject,
      text,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    console.log("[MAILER] Gmail API send completed.", {
      messageIdPresent: Boolean(response.data.id),
    });

    return {
      sent: true,
      messageId: response.data.id,
    };
  } catch (err) {
    console.error("[MAILER ERROR] Gmail API send failed.", {
      message: err.message,
      code: err.code ?? null,
      status: err.response?.status ?? null,
    });

    return {
      sent: false,
      error: err.message,
    };
  }
}

function verificationEmailHtml(code) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0284c7; margin: 0; font-size: 24px;">CareMesh</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">
          Community Resilience &amp; Mutual Aid Network
        </p>
      </div>

      <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <p style="color: #334155; font-size: 15px;">
          Welcome! Enter the following code to verify your email address and activate your account:
        </p>

        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #0284c7; border-radius: 8px; display: inline-block; font-family: monospace;">
          ${code}
        </div>

        <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
          This code is valid for 15 minutes.
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you did not attempt to create a CareMesh account, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(toEmail, code) {
  return sendEmail({
    to: toEmail,
    displayName: "CareMesh Community",
    subject: "Your CareMesh Email Verification Code",
    text: [
      "Welcome to CareMesh!",
      "",
      `Your 6-digit email verification code is: ${code}`,
      "",
      "This code will expire in 15 minutes.",
      "",
      "If you did not request this, please ignore this message.",
    ].join("\n"),
    html: verificationEmailHtml(code),
  });
}

export async function sendPasswordResetEmail(toEmail, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0284c7; margin: 0; font-size: 24px;">CareMesh</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">
          Password Reset Request
        </p>
      </div>

      <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <p style="color: #334155; font-size: 15px;">
          Use the following code to reset your password:
        </p>

        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #0284c7; border-radius: 8px; display: inline-block; font-family: monospace;">
          ${code}
        </div>

        <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
          This code is valid for 15 minutes.
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you did not request a password reset, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    displayName: "CareMesh Security",
    subject: "Your CareMesh Password Reset Code",
    text: [
      "Your CareMesh password reset code is:",
      "",
      code,
      "",
      "This code will expire in 15 minutes.",
      "",
      "If you did not request a password reset, please ignore this message.",
    ].join("\n"),
    html,
  });
}
