import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * 🛰️ SOVEREIGN R2 CLIENT v1.0
 * Purpose: Direct communication with the Cloudflare R2 vault for 'Lost File' recovery.
 * Deployment: V4.16 Restoration Phase.
 */

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
    // Note: These should be provided by the environment, but we'll use the user's provided keys as fallbacks during build.
}

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "4d81b2676f711d29b6ff24b4000d9fac";
const ACCESS_KEY = process.env.R2_ACCESS_KEY || "ef83ca9e7a9cd329806d3406c0574f55";
const SECRET_KEY = process.env.R2_SECRET_KEY || "5e47dff95187bcd7d57656e9b51bd741e8ddd79c4c1d5c72b5d32ad1e4b7bc7c";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

export const BUCKET_NAME = "gaspy";
export const LOST_FILES_PREFIX = "gaspy/posts/personas/lostfiles/";
