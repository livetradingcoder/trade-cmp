import { describe, expect, it } from "vitest";

describe("normalized trading models", () => {
  it("exports model files", async () => {
    const modules = await Promise.all([
      import("../../models/BrokerIntegration"),
      import("../../models/TradingAccount"),
      import("../../models/AccountSnapshot"),
      import("../../models/Trade"),
      import("../../models/SyncRun"),
    ]);

    expect(modules).toHaveLength(5);
  });
});
