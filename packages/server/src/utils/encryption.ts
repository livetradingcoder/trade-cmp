import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size

/**
 * Get encryption key from environment variables
 * Falls back to JWT_SECRET if ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!key) {
    throw new Error("ENCRYPTION_KEY or JWT_SECRET must be set in environment variables");
  }

  // Create a 32-byte key from the provided string
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypts a string using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return IV and encrypted data separated by colon
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts a string encrypted with the encrypt function
 * @param encryptedText - Encrypted text in format: iv:encryptedData (hex encoded)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(":");

    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
