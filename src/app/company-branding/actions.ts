"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseCompanyBrandingFormData,
  type CompanyBrandingFieldErrors,
  type CompanyBrandingFormValues,
} from "@/lib/company-branding/model";
import { upsertCompanyBranding } from "@/lib/company-branding/repository";

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

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  await upsertCompanyBranding(result.data);
  revalidatePath("/company-branding");

  return {
    status: "success",
    message: "Company Branding saved.",
  };
}
