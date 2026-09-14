// app/lib/email.ts
import nodemailer from 'nodemailer';

// Create transporter
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  try {
    const mailOptions = {
      from: `"RedPulse" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 RedPulse - OTP for Password Change',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RedPulse OTP</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 3px solid #dc2626;">
                      <h1 style="color: #dc2626; font-size: 28px; margin: 0;">
                        <span style="display: inline-block; margin-right: 8px;">🩸</span> RedPulse
                      </h1>
                      <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Blood Donation Management System</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="color: #333; font-size: 22px; margin-top: 0;">Password Change Request</h2>
                      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi there,</p>
                      <p style="color: #555; font-size: 16px; line-height: 1.6;">You requested to change your password for your RedPulse account. Use the following One-Time Password (OTP) to complete the process:</p>
                      
                      <!-- OTP Box -->
                      <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; border: 2px dashed #dc2626;">
                        <p style="color: #888; font-size: 14px; margin: 0 0 10px 0; letter-spacing: 2px;">YOUR OTP CODE</p>
                        <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #dc2626; font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 6px; display: inline-block;">
                          ${otp}
                        </div>
                      </div>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #856404; font-size: 14px; margin: 0;">
                          ⏰ This OTP is valid for <strong>5 minutes</strong> from the time of this email.
                        </p>
                      </div>
                      
                      <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 20px;">If you did not request this password change, please ignore this email and ensure your account is secure.</p>
                      
                      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                      
                      <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0;">
                        Need help? Contact our support team at 
                        <a href="mailto:support@redpulse.com" style="color: #dc2626; text-decoration: none;">support@redpulse.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f8f8f8; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="color: #999; font-size: 12px; margin: 0;">
                        &copy; 2026 RedPulse. All rights reserved.
                      </p>
                      <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}