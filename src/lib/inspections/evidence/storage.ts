import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "inspection-evidence";

export async function uploadInspectionEvidencePhoto(input: {
  inspectionId: string;
  itemId: string;
  photo: { buffer: Buffer; contentType: string };
}): Promise<string> {
  const path = `${input.inspectionId}/${input.itemId}/${crypto.randomUUID()}.jpg`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, input.photo.buffer, {
    contentType: input.photo.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error("Photo could not be uploaded.");
  }

  return path;
}

export async function removeInspectionEvidencePhoto(storagePath: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function createInspectionEvidencePhotoUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
