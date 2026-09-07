import { decrypt, encrypt } from "../../utils/encryption";

/**
 * Per-integration broker credentials, stored on BrokerIntegration.config.
 *
 * Credentials used to come from global env (FP_MARKETS_*), which works for
 * exactly one broker. Holding them per integration is what lets a second
 * broker — or a second account of the same broker — be added without a deploy.
 *
 * Secrets are encrypted at rest under a "<key>_encrypted" name, so it is
 * obvious from the stored document which fields are ciphertext. Reads decrypt
 * back to the bare key; writes encrypt; API responses redact.
 */
export type BrokerConfig = Record<string, unknown>;

const ENCRYPTED_SUFFIX = "_encrypted";

/** Config keys treated as secret. Matched on the bare key name. */
const SECRET_KEYS = new Set([
  "token",
  "secret",
  "password",
  "api_key",
  "apikey",
  "client_secret",
]);

export function isSecretKey(key: string): boolean {
  return SECRET_KEYS.has(key.trim().toLowerCase());
}

/** What redactBrokerConfig substitutes for a secret. */
export const REDACTED = "********";

/**
 * Prepare admin-supplied config for storage: encrypt anything secret.
 *
 * Merges over `existing` (already in stored form) so an edit that only changes
 * one field keeps the rest. Two cases would otherwise destroy credentials:
 * a value already carrying the encrypted suffix must not be encrypted twice,
 * and the redaction marker the API hands back must not be written over the
 * real secret when an admin edits an unrelated field and posts the form back.
 */
export function encryptBrokerConfig(
  raw: BrokerConfig,
  existing: BrokerConfig = {}
): BrokerConfig {
  const stored: BrokerConfig = { ...existing };

  for (const [key, value] of Object.entries(raw || {})) {
    if (key.endsWith(ENCRYPTED_SUFFIX)) {
      stored[key] = value; // already ciphertext — pass through untouched
      continue;
    }

    if (isSecretKey(key)) {
      // Unchanged in the UI: leave whatever is stored in place.
      if (value === REDACTED || value === "" || value == null) continue;
      if (typeof value === "string") {
        stored[`${key}${ENCRYPTED_SUFFIX}`] = encrypt(value);
        delete stored[key];
        continue;
      }
    }

    stored[key] = value;
  }

  return stored;
}

/**
 * Config as a connector should see it: secrets decrypted back to their bare
 * key. A value that fails to decrypt is dropped rather than passed through as
 * ciphertext, so the connector falls back to env instead of authenticating
 * with garbage.
 */
export function resolveBrokerConfig(stored?: BrokerConfig | null): BrokerConfig {
  const resolved: BrokerConfig = {};
  for (const [key, value] of Object.entries(stored || {})) {
    if (key.endsWith(ENCRYPTED_SUFFIX) && typeof value === "string") {
      const bare = key.slice(0, -ENCRYPTED_SUFFIX.length);
      try {
        resolved[bare] = decrypt(value);
      } catch {
        // Wrong ENCRYPTION_KEY, or corrupted value.
      }
      continue;
    }
    resolved[key] = value;
  }
  return resolved;
}

/** Config safe to return over the API: secrets replaced with a marker. */
export function redactBrokerConfig(stored?: BrokerConfig | null): BrokerConfig {
  const safe: BrokerConfig = {};
  for (const [key, value] of Object.entries(stored || {})) {
    if (key.endsWith(ENCRYPTED_SUFFIX)) {
      const bare = key.slice(0, -ENCRYPTED_SUFFIX.length);
      safe[bare] = value ? REDACTED : "";
      continue;
    }
    safe[key] = isSecretKey(key) && value ? REDACTED : value;
  }
  return safe;
}
