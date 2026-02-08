import nodemailer from "nodemailer";
import Settings from "../models/Settings";
import { decrypt } from "./encryption";

export interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Retrieves SMTP settings from database with fallback to environment variables
 * @returns SMTP configuration object or null if not configured
 */
export async function getSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    // Try to fetch settings from database
    const [host, port, secure, user, pass, from] = await Promise.all([
      Settings.findOne({ key: "smtp_host" }),
      Settings.findOne({ key: "smtp_port" }),
      Settings.findOne({ key: "smtp_secure" }),
      Settings.findOne({ key: "smtp_user" }),
      Settings.findOne({ key: "smtp_pass" }),
      Settings.findOne({ key: "smtp_from" }),
    ]);

    // Check if we have database settings
    const hasDbSettings = host?.value || user?.value;

    if (hasDbSettings) {
      // Use database settings
      const encryptedPass = pass?.value || "";
      let decryptedPass = "";

      if (encryptedPass) {
        try {
          decryptedPass = decrypt(encryptedPass);
        } catch (error) {
          console.error("Failed to decrypt SMTP password:", error);
          // Continue with empty password rather than failing completely
        }
      }

      return {
        host: host?.value || "",
        port: parseInt(port?.value || "587", 10),
        secure: secure?.value === "true",
        user: user?.value || "",
        pass: decryptedPass,
        from: from?.value || "",
      };
    }

    // Fall back to environment variables (backward compatibility)
    const envHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const envPort = process.env.EMAIL_PORT || process.env.SMTP_PORT;
    const envUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const envPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const envFrom = process.env.EMAIL_FROM;

    if (envHost && envUser) {
      return {
        host: envHost,
        port: parseInt(envPort || "587", 10),
        secure: process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true",
        user: envUser,
        pass: envPass || "",
        from: envFrom || "",
      };
    }

    // No SMTP configuration found
    return null;
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return null;
  }
}

/**
 * Creates a nodemailer transporter using database or environment SMTP settings
 * @returns Nodemailer transporter or null if SMTP not configured
 */
export async function createEmailTransporter(): Promise<nodemailer.Transporter | null> {
  const smtpSettings = await getSMTPSettings();

  if (!smtpSettings || !smtpSettings.host || !smtpSettings.user) {
    console.log("SMTP not configured - no transporter created");
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass,
      },
      // Add timeout configuration to prevent gateway timeouts
      connectionTimeout: 10000, // 10 seconds to establish connection
      greetingTimeout: 5000,    // 5 seconds to receive greeting after connection
      socketTimeout: 10000,     // 10 seconds of inactivity before timeout
    });

    return transporter;
  } catch (error) {
    console.error("Error creating email transporter:", error);
    return null;
  }
}

/**
 * Gets the "from" email address from SMTP settings
 * @returns From email address or default
 */
export async function getFromAddress(): Promise<string> {
  const smtpSettings = await getSMTPSettings();
  return smtpSettings?.from || "noreply@livetradingleague.com";
}
