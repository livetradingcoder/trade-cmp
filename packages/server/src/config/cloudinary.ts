import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from either CLOUDINARY_URL (the single "API environment
// variable" Cloudinary's dashboard gives you, which the SDK reads itself) or
// the three separate variables. Only pass the ones that are set: an explicit
// undefined here would wipe what the SDK already read from CLOUDINARY_URL.
const explicit: Record<string, string> = {};
for (const [key, name] of [
  ["cloud_name", "CLOUDINARY_CLOUD_NAME"],
  ["api_key", "CLOUDINARY_API_KEY"],
  ["api_secret", "CLOUDINARY_API_SECRET"],
] as const) {
  const value = process.env[name]?.trim();
  if (value) explicit[key] = value;
}
cloudinary.config(explicit);

/** Whether uploads can reach Cloudinary at all. */
export function isCloudinaryConfigured(): boolean {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return Boolean(cloud_name && api_key && api_secret);
}

export default cloudinary;
