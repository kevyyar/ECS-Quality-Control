import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "company-branding";
const MAX_LOGO_BYTES = 2_000_000;

const CONTENT_TYPE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type LogoContentType = keyof typeof CONTENT_TYPE_EXTENSIONS;

function logoContentType(contentType: string): LogoContentType | null {
  return contentType in CONTENT_TYPE_EXTENSIONS
    ? (contentType as LogoContentType)
    : null;
}

export function validateCompanyLogoFile(file: File): string | null {
  if (file.size > MAX_LOGO_BYTES) {
    return "Logo file must be 2 MB or smaller.";
  }

  if (!logoContentType(file.type)) {
    return "Logo file must be a PNG, JPG, or WEBP image.";
  }

  return null;
}

async function ensureCompanyBrandingBucket(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);

  if (data) {
    if (!data.public) {
      const { error } = await supabase.storage.updateBucket(BUCKET, {
        public: true,
      });

      if (error) {
        throw error;
      }
    }

    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

export async function uploadCompanyLogo(file: File): Promise<string> {
  const contentType = logoContentType(file.type);

  if (!contentType) {
    throw new Error("Logo file type is not supported.");
  }

  const supabase = createSupabaseAdminClient();
  await ensureCompanyBrandingBucket(supabase);

  const extension = CONTENT_TYPE_EXTENSIONS[contentType];
  const storagePath = `logos/${crypto.randomUUID()}.${extension}`;
  const logoBytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, logoBytes, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error("Logo could not be uploaded.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return data.publicUrl;
}
