import { sendMailgunEmail } from "./mailgunConfig";

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  resetUrl: string
) => {
  try {
    const subject = "Password Reset Request - LiveTradingLeague";
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>We received a request to reset your password for your LiveTradingLeague admin account.</p>
              <p>Click the button below to reset your password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>For security reasons, this link can only be used once.</p>
            </div>
            <div class="footer">
              <p>LiveTradingLeague Admin Portal</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    const text = `
        Password Reset Request - LiveTradingLeague

        Hello Admin,

        We received a request to reset your password for your LiveTradingLeague admin account.

        Click this link to reset your password:
        ${resetUrl}

        This link will expire in 1 hour.

        If you didn't request this, please ignore this email. Your password won't change until you create a new one.

        LiveTradingLeague Admin Portal
      `;

    const result = await sendMailgunEmail({ to: email, subject, html, text });
    if (!result.success) {
      throw new Error(result.error || "Failed to send password reset email");
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
};
