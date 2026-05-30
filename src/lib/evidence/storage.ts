import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "inspection-evidence";

async function uploadEvidencePhoto(input: {
  path: string;
  photo: { buffer: Buffer; contentType: string };
  failureMessage: string;
}): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(input.path, input.photo.buffer, {
    contentType: input.photo.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(input.failureMessage);
  }

  return input.path;
}

export async function uploadInspectionEvidencePhoto(input: {
  inspectionId: string;
  itemId: string;
  photo: { buffer: Buffer; contentType: string };
}): Promise<string> {
  return uploadEvidencePhoto({
    path: `${input.inspectionId}/${input.itemId}/${crypto.randomUUID()}.jpg`,
    photo: input.photo,
    failureMessage: "Photo could not be uploaded.",
  });
}

export async function uploadTicketAfterPhoto(input: {
  ticketId: string;
  photo: { buffer: Buffer; contentType: string };
}): Promise<string> {
  return uploadEvidencePhoto({
    path: `tickets/${input.ticketId}/after/${crypto.randomUUID()}.jpg`,
    photo: input.photo,
    failureMessage: "After Photo could not be uploaded.",
  });
}

export async function downloadEvidencePhoto(
  storagePath: string,
): Promise<Buffer | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (error || !data) {
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function removeEvidencePhoto(storagePath: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function createEvidencePhotoUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
