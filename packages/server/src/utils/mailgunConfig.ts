import Settings from "../models/Settings";
import { decrypt } from "./encryption";

export interface MailgunSettings {
  apiKey: string;
  domain: string;
  from: string;
}

/**
 * Mailgun's HTTP API only needs outbound HTTPS (443), unlike SMTP (25/587/465)
 * which Railway's network blocks outright — confirmed via ETIMEDOUT on every
 * SMTP attempt regardless of host/credentials.
 */
const MAILGUN_API_BASE = "https://api.mailgun.net/v3";

export async function getMailgunSettings(): Promise<MailgunSettings | null> {
  try {
    const [apiKey, domain, from] = await Promise.all([
      Settings.findOne({ key: "mailgun_api_key" }),
      Settings.findOne({ key: "mailgun_domain" }),
      Settings.findOne({ key: "smtp_from" }),
    ]);

    if (!apiKey?.value || !domain?.value) {
      return null;
    }

    let decryptedKey = "";
    try {
      decryptedKey = decrypt(apiKey.value);
    } catch (error) {
      console.error("Failed to decrypt Mailgun API key:", error);
      return null;
    }

    return {
      apiKey: decryptedKey,
      domain: domain.value,
      from: from?.value || "",
    };
  } catch (error) {
    console.error("Error fetching Mailgun settings:", error);
    return null;
  }
}

export async function sendMailgunEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = await getMailgunSettings();

  if (!settings) {
    console.log(`[Email] Mailgun not configured. Would send email to ${options.to}: ${options.subject}`);
    return { success: true };
  }

  // Add a display name if the configured "from" is a bare address (no "Name <email>" already)
  const fromAddress = settings.from || `noreply@${settings.domain}`;
  const from = /<.+>/.test(fromAddress) ? fromAddress : `LiveTradingLeague <${fromAddress}>`;

  const body = new URLSearchParams({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || "",
  });

  try {
    const response = await fetch(`${MAILGUN_API_BASE}/${settings.domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${settings.apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || `Mailgun API error (HTTP ${response.status})`;
      throw new Error(message);
    }

    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error(`[Email] Mailgun send failed for ${options.to}:`, error);
    return { success: false, error: error?.message || "Mailgun send failed" };
  }
}
