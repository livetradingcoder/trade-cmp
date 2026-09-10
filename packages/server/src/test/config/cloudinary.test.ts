import { describe, expect, it } from "vitest";

/**
 * Cloudinary's dashboard hands out one value, CLOUDINARY_URL. The SDK reads it
 * on its own, so our config must not overwrite it with unset variables.
 */
describe("cloudinary config", () => {
  it("is configured from CLOUDINARY_URL alone", async () => {
    process.env.CLOUDINARY_URL = "cloudinary://111111:fake-secret@demo-cloud";
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    try {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      expect(isCloudinaryConfigured()).toBe(true);
    } finally {
      delete process.env.CLOUDINARY_URL;
    }
  });
});
