import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_URL || 'https://api.mailgun.net' 
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun configuration is missing');
    }

    const data = {
      from: `${process.env.APP_NAME || 'AGFE'} <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
    console.log('Email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

export function generatePasswordResetEmail(resetUrl: string, userEmail: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 500px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 {
          color: #1E1E1E;
          font-size: 24px;
          margin: 0 0 30px 0;
          font-weight: 600;
        }
        p {
          margin: 16px 0;
          color: #555;
        }
        .button {
          display: inline-block;
          background: #1BE1FF;
          color: #1E1E1E;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 24px 0;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 14px;
        }
        .link {
          color: #1BE1FF;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <h1>Reset Your Password</h1>
      
      <p>Hello,</p>
      
      <p>We received a request to reset the password for your account: <strong>${userEmail}</strong></p>
      
      <p>Click the button below to reset your password:</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
      
      <p>This link will expire in 1 hour for your security.</p>
      
      <p>If you didn't request this reset, please ignore this email.</p>
      
      <div class="footer">
        <p>Best regards,<br>AGFE Team</p>
      </div>
    </body>
    </html>
  `;
  const text = `
Reset Your Password - AGFE

Hello,

We received a request to reset the password for your account: ${userEmail}

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for your security.

If you didn't request this reset, please ignore this email.

Best regards,
AGFE Team
  `;

  return { html, text };
}
