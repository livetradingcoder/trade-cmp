import { sendMailgunEmail } from "./mailgunConfig";

const LOGO_URL = "https://app.livetradingleague.com/ltl.png";
const WEBSITE_URL = "https://app.livetradingleague.com";
// TODO: replace with real social links
const DISCORD_URL = "#";
const X_URL = "#";
const YOUTUBE_URL = "#";

/** Wraps a body block in the branded LiveTradingLeague email shell. */
function renderEmailShell(bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LiveTradingLeague</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0d0d0d">
<tr>
<td align="center">
<table width="650" cellpadding="0" cellspacing="0" style="max-width:650px;margin:40px auto;">
<tr>
<td align="center" style="padding-bottom:35px;">
<img src="${LOGO_URL}" alt="LiveTradingLeague" style="max-width:360px;width:100%;height:auto;display:block;">
</td>
</tr>
<tr>
<td style="background:#161616;border:1px solid #2c2c2c;border-radius:12px;padding:50px;">
${bodyHtml}
<hr style="margin:40px 0;border:none;border-top:1px solid #333;">
<p style="font-size:18px;line-height:30px;color:#888;margin:0;">
This is an automated message from <strong>LiveTradingLeague</strong>.<br>
Please do not reply to this email.
</p>
</td>
</tr>
<tr>
<td align="center" style="padding:40px 20px;">
<div style="font-size:38px;font-weight:bold;color:white;">Live<span style="color:#2c8cff;">Trading</span>League</div>
<div style="margin-top:12px;font-size:22px;color:#888;">Empowering Traders. Building Champions.</div>
<div style="margin-top:30px;">
<a href="${WEBSITE_URL}" style="color:#2c8cff;text-decoration:none;margin:0 12px;">Website</a>
<a href="${DISCORD_URL}" style="color:#2c8cff;text-decoration:none;margin:0 12px;">Discord</a>
<a href="${X_URL}" style="color:#2c8cff;text-decoration:none;margin:0 12px;">X</a>
<a href="${YOUTUBE_URL}" style="color:#2c8cff;text-decoration:none;margin:0 12px;">YouTube</a>
</div>
<div style="margin-top:30px;font-size:16px;color:#666;">©️ 2026 LiveTradingLeague. All rights reserved.</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

const titleBlock = (title: string) =>
  `<h1 style="margin:0;font-size:42px;color:#d8821d;font-weight:bold;">${title}</h1><div style="height:35px;"></div>`;

const messageBlock = (message: string) =>
  `<p style="font-size:30px;line-height:45px;color:white;margin:0;">${message}</p><div style="height:35px;"></div>`;

const highlightBox = (label: string, value: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#222;border-left:6px solid #d8821d;border-radius:6px;">
<tr>
<td style="padding:28px;">
<div style="font-size:22px;font-weight:bold;color:white;margin-bottom:12px;">${label}</div>
<div style="font-size:22px;color:white;">${value}</div>
</td>
</tr>
</table>
<div style="height:35px;"></div>`;

const bodyText = (text: string) =>
  `<p style="margin:0;font-size:24px;line-height:38px;color:white;">${text}</p><div style="height:35px;"></div>`;

// Email templates
const templates = {
  applicationSubmitted: (email: string, tournamentTitle: string) => ({
    subject: `Application Submitted - ${tournamentTitle}`,
    html: renderEmailShell(
      titleBlock("Application Submitted") +
        messageBlock(`Thank you for applying to <strong>${tournamentTitle}</strong>.`) +
        bodyText(
          "Your application is currently <strong>pending admin review</strong>. You will receive an email notification once your application has been reviewed."
        )
    ),
  }),

  applicationApproved: (email: string, tournamentTitle: string, startDate: string, endDate: string) => ({
    subject: `Application Approved - ${tournamentTitle}`,
    html: renderEmailShell(
      titleBlock("Application Approved!") +
        messageBlock(`Your application to participate in <strong>${tournamentTitle}</strong> has been approved!`) +
        highlightBox("Competition Details", `Start Date: ${startDate}<br>End Date: ${endDate}`) +
        bodyText("Good luck in the competition!")
    ),
  }),

  applicationDeclined: (email: string, tournamentTitle: string, reason: string) => ({
    subject: `Application Declined - ${tournamentTitle}`,
    html: renderEmailShell(
      titleBlock("Application Declined") +
        messageBlock(`Unfortunately, your application to join <strong>${tournamentTitle}</strong> was not approved.`) +
        highlightBox("Reason", reason) +
        bodyText("If you believe this is an error, please contact support.")
    ),
  }),

  participantDisqualified: (email: string, tournamentTitle: string, reason: string) => ({
    subject: `Disqualified from Competition - ${tournamentTitle}`,
    html: renderEmailShell(
      titleBlock("Disqualified from Competition") +
        messageBlock(`We regret to inform you that you have been disqualified from <strong>${tournamentTitle}</strong>.`) +
        highlightBox("Reason", reason) +
        bodyText(
          "<strong>Important:</strong> This decision only affects your participation in this competition and does not impact your FPTrading trading account."
        )
    ),
  }),
};

// Send email function
export const sendEmail = async (to: string, template: { subject: string; html: string }) => {
  const result = await sendMailgunEmail({ to, subject: template.subject, html: template.html });
  if (result.success) {
    console.log(`[Email] Sent to ${to}${result.messageId ? `: ${result.messageId}` : " (skipped, not configured)"}`);
  }
  return result;
};

// Export templates
export const emailTemplates = templates;
