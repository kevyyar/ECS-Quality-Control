import "server-only";

import { eq } from "drizzle-orm";

import { internalUsers } from "@/db/schema";

import { normalizeCapabilities, type UserCapability } from "./capabilities";

export type InternalUserProfile = {
  id: string;
  authUserId: string;
  email: string;
  capabilities: UserCapability[];
};

type InternalUserRow = typeof internalUsers.$inferSelect;

export function toInternalUserProfile(row: InternalUserRow): InternalUserProfile {
  return {
    id: row.id,
    authUserId: row.authUserId,
    email: row.email,
    capabilities: normalizeCapabilities({
      manager: row.manager,
      supervisor: row.supervisor,
    }),
  };
}

export async function getInternalUserProfileByAuthUserId(
  authUserId: string,
): Promise<InternalUserProfile | null> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.authUserId, authUserId))
    .limit(1);

  return row ? toInternalUserProfile(row) : null;
}
