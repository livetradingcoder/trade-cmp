import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const templates = {
  applicationSubmitted: (email: string, tournamentTitle: string) => ({
    subject: `Application Submitted - ${tournamentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066ff;">Application Submitted Successfully</h2>
        <p>Thank you for applying to <strong>${tournamentTitle}</strong>.</p>
        <p>Your application is currently <strong>pending admin review</strong>.</p>
        <p>You will receive an email notification once your application has been reviewed.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated message from LiveTradingLeague. Please do not reply to this email.
        </p>
      </div>
    `,
  }),

  applicationApproved: (email: string, tournamentTitle: string, startDate: string, endDate: string) => ({
    subject: `Application Approved - ${tournamentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Congratulations! Application Approved</h2>
        <p>Your application to participate in <strong>${tournamentTitle}</strong> has been approved!</p>
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Competition Details:</strong></p>
          <p style="margin: 5px 0;">Start Date: ${startDate}</p>
          <p style="margin: 5px 0;">End Date: ${endDate}</p>
        </div>
        <p>Good luck in the competition!</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated message from LiveTradingLeague. Please do not reply to this email.
        </p>
      </div>
    `,
  }),

  applicationDeclined: (email: string, tournamentTitle: string, reason: string) => ({
    subject: `Application Declined - ${tournamentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Declined</h2>
        <p>Unfortunately, your application to join <strong>${tournamentTitle}</strong> was not approved.</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0;">${reason}</p>
        </div>
        <p>If you believe this is an error, please contact support.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated message from LiveTradingLeague. Please do not reply to this email.
        </p>
      </div>
    `,
  }),

  participantDisqualified: (email: string, tournamentTitle: string, reason: string) => ({
    subject: `Disqualified from Competition - ${tournamentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fb923c;">Competition Disqualification</h2>
        <p>We regret to inform you that you have been disqualified from <strong>${tournamentTitle}</strong>.</p>
        <div style="background: #fff7ed; border-left: 4px solid #fb923c; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0;">${reason}</p>
        </div>
        <p><strong>Important:</strong> This decision only affects your participation in this competition and does not impact your FP Markets trading account.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          This is an automated message from LiveTradingLeague. Please do not reply to this email.
        </p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to: string, template: { subject: string; html: string }) => {
  try {
    // Skip sending if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[Email] SMTP not configured. Would send email to ${to}: ${template.subject}`);
      return { success: true, skipped: true };
    }

    const info = await transporter.sendMail({
      from: `"LiveTradingLeague" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return { success: false, error };
  }
};

// Export templates
export const emailTemplates = templates;
