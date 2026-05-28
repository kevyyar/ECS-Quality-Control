import "server-only";

import { eq, sql } from "drizzle-orm";

import { companyBranding } from "@/db/schema";

import {
  COMPANY_BRANDING_SINGLETON_KEY,
  DEFAULT_COMPANY_BRANDING,
  type CompanyBranding,
} from "./model";

type CompanyBrandingRow = typeof companyBranding.$inferSelect;

function toCompanyBranding(row: CompanyBrandingRow): CompanyBranding {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    primaryBrandColor: row.primaryBrandColor,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    contactWebsite: row.contactWebsite,
    contactAddress: row.contactAddress,
  };
}

export async function getCompanyBranding(): Promise<CompanyBranding> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .select()
    .from(companyBranding)
    .where(eq(companyBranding.singletonKey, COMPANY_BRANDING_SINGLETON_KEY))
    .limit(1);

  return row ? toCompanyBranding(row) : DEFAULT_COMPANY_BRANDING;
}

export async function upsertCompanyBranding(
  branding: CompanyBranding,
): Promise<CompanyBranding> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .insert(companyBranding)
    .values({
      singletonKey: COMPANY_BRANDING_SINGLETON_KEY,
      displayName: branding.displayName,
      logoUrl: branding.logoUrl,
      primaryBrandColor: branding.primaryBrandColor,
      contactPhone: branding.contactPhone,
      contactEmail: branding.contactEmail,
      contactWebsite: branding.contactWebsite,
      contactAddress: branding.contactAddress,
    })
    .onConflictDoUpdate({
      target: companyBranding.singletonKey,
      set: {
        displayName: branding.displayName,
        logoUrl: branding.logoUrl,
        primaryBrandColor: branding.primaryBrandColor,
        contactPhone: branding.contactPhone,
        contactEmail: branding.contactEmail,
        contactWebsite: branding.contactWebsite,
        contactAddress: branding.contactAddress,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Company Branding could not be saved.");
  }

  return toCompanyBranding(row);
}
