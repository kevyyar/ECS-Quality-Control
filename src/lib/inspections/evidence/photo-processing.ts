import "server-only";

import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProcessedInspectionPhoto = {
  buffer: Buffer;
  contentType: "image/jpeg";
};

export async function processInspectionPhoto(file: File): Promise<ProcessedInspectionPhoto> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Upload a JPEG, PNG, or WebP photo.");
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Photo must be 10 MB or smaller.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const buffer = await sharp(input)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return { buffer, contentType: "image/jpeg" };
}
