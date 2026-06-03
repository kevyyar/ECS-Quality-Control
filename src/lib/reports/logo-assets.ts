import "server-only";

import { readFile } from "node:fs/promises";
import { join, posix } from "node:path";

import sharp from "sharp";

const MAX_LOGO_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 5_000;
const PUBLIC_LOGO_PATH_PREFIX = "/storage/v1/object/public/company-branding/logos/";

async function normalizeLogoAsset(logoBytes: Buffer): Promise<Buffer | null> {
  if (logoBytes.byteLength > MAX_LOGO_BYTES) {
    return null;
  }

  try {
    return await sharp(logoBytes)
      .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return logoBytes;
  }
}

function isAllowedUploadedLogoUrl(logoUrl: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl.startsWith("replace-with")) {
    return false;
  }

  try {
    const url = new URL(logoUrl);
    const allowedBase = new URL(supabaseUrl);

    return (
      url.origin === allowedBase.origin &&
      url.pathname.startsWith(PUBLIC_LOGO_PATH_PREFIX) &&
      !url.pathname.split("/").includes("..")
    );
  } catch {
    return false;
  }
}

async function readResponseBuffer(response: Response): Promise<Buffer | null> {
  const contentType = response.headers.get("content-type");

  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    return null;
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_LOGO_BYTES) {
    return null;
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.byteLength > MAX_LOGO_BYTES ? null : buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_LOGO_BYTES) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

async function loadUploadedLogoAsset(logoUrl: string): Promise<Buffer | null> {
  if (!isAllowedUploadedLogoUrl(logoUrl)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(logoUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const logoBytes = await readResponseBuffer(response);

    return logoBytes ? normalizeLogoAsset(logoBytes) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadReportLogoAsset(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) {
    return null;
  }

  if (!logoUrl.startsWith("/")) {
    return loadUploadedLogoAsset(logoUrl);
  }

  if (logoUrl.startsWith("//") || logoUrl.split("/").includes("..")) {
    return null;
  }

  const normalized = posix.normalize(logoUrl);

  if (!normalized.startsWith("/")) {
    return null;
  }

  try {
    return normalizeLogoAsset(await readFile(join(process.cwd(), "public", normalized.slice(1))));
  } catch {
    return null;
  }
}
