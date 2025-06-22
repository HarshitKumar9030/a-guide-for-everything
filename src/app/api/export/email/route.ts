import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, csvContent, guideCount } = await req.json();

    if (!email || !csvContent) {
      return NextResponse.json(
        { error: 'Email and CSV content are required' },
        { status: 400 }
      );
    }

    const subject = `Your AGFE Guides Export (${guideCount} guides)`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your AGFE Guides Export</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">AGFE</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Guides Export is Ready</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">📊 Export Summary</h2>
            <p style="margin: 15px 0;">We've successfully exported <strong>${guideCount}</strong> of your guides from AGFE.</p>
            <p style="margin: 15px 0;">The CSV file attached contains:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
              <li>Guide titles and prompts</li>
              <li>AI models used</li>
              <li>Privacy settings</li>
              <li>View counts</li>
              <li>Creation and update dates</li>
              <li>Direct links to your guides</li>
            </ul>
          </div>

          <div style="background: #fff; border: 1px solid #e9ecef; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0;">📎 CSV File Attached</h3>
            <p style="margin: 15px 0;">Your guides have been exported to a CSV file that's attached to this email. You can open it with Excel, Google Sheets, or any spreadsheet application.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://agfe.tech" style="display: inline-block; background: linear-gradient(135deg, #1BE1FF 0%, #1B9AFF 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Visit AGFE</a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 14px;">
            <p>This email was sent from AGFE (agfe.tech)</p>
            <p>If you didn't request this export, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Your AGFE Guides Export

Hi there!

We've successfully exported ${guideCount} of your guides from AGFE.

The CSV file attached contains:
- Guide titles and prompts
- AI models used
- Privacy settings
- View counts
- Creation and update dates
- Direct links to your guides


Visit AGFE: https://agfe.tech

---
This email was sent from AGFE (agfe.tech)
If you didn't request this export, please ignore this email.
    `;

    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const fileName = `agfe-guides-${new Date().toISOString().split('T')[0]}.csv`;

    await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: fileName,
          content: csvBuffer,
          contentType: 'text/csv'
        }
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Export sent successfully'
    });

  } catch (error) {
    console.error('Email export error:', error);
    return NextResponse.json(
      { error: 'Failed to send export email' },
      { status: 500 }
    );
  }
}
