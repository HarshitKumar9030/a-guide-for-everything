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
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail({ to, subject, html, text, attachments }: EmailOptions) {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun configuration is missing');
    }

    const baseData = {
      from: `${process.env.APP_NAME || 'AGFE'} <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // Add attachments if provided
    const data = attachments && attachments.length > 0 
      ? {
          ...baseData,
          attachment: attachments.map(att => ({
            filename: att.filename,
            data: att.content,
            contentType: att.contentType
          }))
        }      : baseData;

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
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - AGFE</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">AGFE</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password 🔐</h2>
          <p style="margin: 15px 0;">We received a request to reset the password for your AGFE account: <strong>${userEmail}</strong></p>
          <p style="margin: 15px 0;">Click the button below to create a new password for your account.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset My Password</a>
        </div>

        <div style="background: #fff; border: 1px solid #e9ecef; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0;">Alternative Link</h3>
          <p style="margin: 15px 0;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 15px 0; word-break: break-all;"><a href="${resetUrl}" style="color: #1BE1FF;">${resetUrl}</a></p>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong> This password reset link will expire in 1 hour for your security.</p>
        </div>

        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <p style="margin: 0; color: #721c24;"><strong>🔒 Security Note:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 14px;">
          <p>This email was sent from AGFE (agfe.tech)</p>
          <p>Need help? Visit <a href="https://agfe.tech" style="color: #1BE1FF;">agfe.tech</a></p>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Reset Your Password - AGFE

Hi there!

We received a request to reset the password for your AGFE account: ${userEmail}

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for your security.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Need help? Visit: https://agfe.tech

---
This email was sent from AGFE (agfe.tech)
  `;

  return { html, text };
}
