import { beforeAll, describe, expect, it } from "vitest";

import {
  encryptBrokerConfig,
  resolveBrokerConfig,
  redactBrokerConfig,
} from "../../services/brokers/config";
import { loadFpMarketsConfig } from "../../services/brokers/fpMarketsConnector";

/**
 * Per-integration credentials. The properties that matter: secrets are not
 * stored in plaintext, never come back over the API, and the original env-based
 * integration keeps working untouched.
 */

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test-encryption-key";
});

describe("broker config storage", () => {
  it("encrypts secrets and leaves other fields readable", () => {
    const stored = encryptBrokerConfig({
      base_url: "https://ib.example.test",
      rebate_accounts: "477779",
      token: "tok-123",
      secret: "sec-456",
    });

    // Non-secrets stay queryable/debuggable in the document.
    expect(stored.base_url).toBe("https://ib.example.test");
    expect(stored.rebate_accounts).toBe("477779");

    // Secrets are re-keyed and unreadable at rest.
    expect(stored.token).toBeUndefined();
    expect(stored.secret).toBeUndefined();
    expect(typeof stored.token_encrypted).toBe("string");
    expect(stored.token_encrypted).not.toContain("tok-123");
    expect(JSON.stringify(stored)).not.toContain("sec-456");
  });

  it("round-trips back to what a connector needs", () => {
    const resolved = resolveBrokerConfig(
      encryptBrokerConfig({ token: "tok-123", secret: "sec-456", base_url: "x" })
    );
    expect(resolved).toEqual({
      token: "tok-123",
      secret: "sec-456",
      base_url: "x",
    });
  });

  it("drops a value it cannot decrypt rather than passing ciphertext on", () => {
    // Wrong key or corrupted value: authenticating with garbage is worse than
    // falling back to env.
    const resolved = resolveBrokerConfig({ token_encrypted: "not:decryptable" });
    expect(resolved.token).toBeUndefined();
  });

  it("redacts secrets for API responses", () => {
    const stored = encryptBrokerConfig({ token: "tok-123", base_url: "x" });
    const safe = redactBrokerConfig(stored);

    expect(safe.token).toBe("********");
    expect(safe.base_url).toBe("x");
    expect(JSON.stringify(safe)).not.toContain("tok-123");
    // The ciphertext must not leak either.
    expect(safe.token_encrypted).toBeUndefined();
  });

  it("re-encrypting an already-stored config does not double-wrap", () => {
    const once = encryptBrokerConfig({ token: "tok-123" });
    const twice = encryptBrokerConfig(once);
    expect(resolveBrokerConfig(twice).token).toBe("tok-123");
  });

  it("keeps the stored secret when the redacted marker is posted back", () => {
    // An admin loads the form (secrets redacted), edits an unrelated field and
    // saves. The marker must not become the new credential.
    const stored = encryptBrokerConfig({ token: "tok-123", base_url: "old" });
    const edited = encryptBrokerConfig(
      { ...redactBrokerConfig(stored), base_url: "new" },
      stored
    );

    expect(resolveBrokerConfig(edited).token).toBe("tok-123");
    expect(edited.base_url).toBe("new");
  });

  it("keeps unrelated stored fields when a partial config is saved", () => {
    const stored = encryptBrokerConfig({
      token: "tok-123",
      rebate_accounts: "477779",
    });
    const edited = encryptBrokerConfig({ base_url: "https://x.test" }, stored);

    const resolved = resolveBrokerConfig(edited);
    expect(resolved.token).toBe("tok-123");
    expect(resolved.rebate_accounts).toBe("477779");
    expect(resolved.base_url).toBe("https://x.test");
  });

  it("replaces the secret when a genuinely new one is supplied", () => {
    const stored = encryptBrokerConfig({ token: "old-token" });
    const edited = encryptBrokerConfig({ token: "new-token" }, stored);
    expect(resolveBrokerConfig(edited).token).toBe("new-token");
  });
});

describe("loadFpMarketsConfig", () => {
  it("prefers the integration's own credentials", () => {
    process.env.FP_MARKETS_TOKEN = "env-token";
    process.env.FP_MARKETS_SECRET = "env-secret";
    process.env.FP_MARKETS_REBATE_ACCOUNTS = "111";

    const config = loadFpMarketsConfig({
      token: "cfg-token",
      secret: "cfg-secret",
      rebate_accounts: "222,333",
      base_url: "https://ib.example.test/",
    });

    expect(config.token).toBe("cfg-token");
    expect(config.rebateAccountNumbers).toEqual(["222", "333"]);
    // Trailing slash trimmed so path joins don't double up.
    expect(config.baseUrl).toBe("https://ib.example.test");
  });

  it("falls back to env, so the existing integration keeps working", () => {
    process.env.FP_MARKETS_TOKEN = "env-token";
    process.env.FP_MARKETS_SECRET = "env-secret";
    process.env.FP_MARKETS_REBATE_ACCOUNTS = "477779";

    const config = loadFpMarketsConfig();
    expect(config.token).toBe("env-token");
    expect(config.rebateAccountNumbers).toEqual(["477779"]);
  });

  it("accepts rebate accounts as an array", () => {
    const config = loadFpMarketsConfig({
      token: "t",
      secret: "s",
      rebate_accounts: ["1", " 2 "],
    });
    expect(config.rebateAccountNumbers).toEqual(["1", "2"]);
  });

  it("throws when neither config nor env supplies credentials", () => {
    delete process.env.FP_MARKETS_TOKEN;
    delete process.env.FP_MARKETS_SECRET;
    expect(() => loadFpMarketsConfig()).toThrow(/token and secret/i);
  });
});
