"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseCompanyBrandingFormData,
  type CompanyBrandingFieldErrors,
  type CompanyBrandingFormValues,
} from "@/lib/company-branding/model";
import {
  uploadCompanyLogo,
  validateCompanyLogoFile,
} from "@/lib/company-branding/logo-storage";
import { upsertCompanyBranding } from "@/lib/company-branding/repository";

function getLogoFile(formData: FormData): File | null {
  const value = formData.get("logoFile");

  return value instanceof File && value.size > 0 ? value : null;
}

function shouldRemoveCurrentLogo(formData: FormData): boolean {
  return formData.get("removeCurrentLogo") === "true";
}

export type CompanyBrandingActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: CompanyBrandingFieldErrors;
      values: CompanyBrandingFormValues;
    };

export async function saveCompanyBranding(
  _previousState: CompanyBrandingActionState,
  formData: FormData,
): Promise<CompanyBrandingActionState> {
  await requireProtectedAction("configureBranding");

  const result = parseCompanyBrandingFormData(formData);
  const logoFile = getLogoFile(formData);
  const removeCurrentLogo = shouldRemoveCurrentLogo(formData);
  const logoFileError = logoFile ? validateCompanyLogoFile(logoFile) : null;

  if (!result.ok || logoFileError) {
    const values = result.ok
      ? (Object.fromEntries(
          Object.entries(result.data).map(([field, value]) => [field, value ?? ""]),
        ) as CompanyBrandingFormValues)
      : result.values;

    return {
      status: "error",
      errors: {
        ...(result.ok ? {} : result.errors),
        ...(logoFileError ? { logoUrl: logoFileError } : {}),
      },
      values,
    };
  }

  const logoUrl = logoFile
    ? await uploadCompanyLogo(logoFile)
    : removeCurrentLogo
      ? null
      : result.data.logoUrl;

  await upsertCompanyBranding({ ...result.data, logoUrl });
  revalidatePath("/company-branding");

  return {
    status: "success",
    message: "Company Branding saved.",
  };
}
