export { COMPANY_BRANDING_SINGLETON_KEY } from "./constants";

export const DEFAULT_COMPANY_BRANDING = {
  displayName: "Janitorial Company",
  logoUrl: null,
  primaryBrandColor: "#0f766e",
  contactPhone: null,
  contactEmail: null,
  contactWebsite: null,
  contactAddress: null,
} satisfies CompanyBranding;

export type CompanyBranding = {
  displayName: string;
  logoUrl: string | null;
  primaryBrandColor: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWebsite: string | null;
  contactAddress: string | null;
};

export type CompanyBrandingField = keyof CompanyBranding;

export type CompanyBrandingFieldErrors = Partial<
  Record<CompanyBrandingField, string>
>;

export type CompanyBrandingFormValues = Record<CompanyBrandingField, string>;

export type CompanyBrandingParseResult =
  | { ok: true; data: CompanyBranding }
  | {
      ok: false;
      errors: CompanyBrandingFieldErrors;
      values: CompanyBrandingFormValues;
    };

const hexColorPattern = /^#[0-9a-f]{6}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldNames = [
  "displayName",
  "logoUrl",
  "primaryBrandColor",
  "contactPhone",
  "contactEmail",
  "contactWebsite",
  "contactAddress",
] as const satisfies readonly CompanyBrandingField[];

function trimFormValue(formData: FormData, field: CompanyBrandingField): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function optionalValue(value: string): string | null {
  return value === "" ? null : value;
}

function isAppRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isAllowedLogoValue(value: string): boolean {
  return isAppRelativePath(value) || isHttpUrl(value);
}

export function parseCompanyBrandingFormData(
  formData: FormData,
): CompanyBrandingParseResult {
  const values = Object.fromEntries(
    fieldNames.map((field) => [field, trimFormValue(formData, field)]),
  ) as CompanyBrandingFormValues;
  const errors: CompanyBrandingFieldErrors = {};

  if (values.displayName === "") {
    errors.displayName = "Company display name is required.";
  } else if (values.displayName.length > 160) {
    errors.displayName = "Company display name must be 160 characters or fewer.";
  }

  if (values.primaryBrandColor === "") {
    errors.primaryBrandColor = "Primary brand color is required.";
  } else if (!hexColorPattern.test(values.primaryBrandColor)) {
    errors.primaryBrandColor =
      "Primary brand color must be a hex color like #0f766e.";
  }

  if (values.logoUrl.length > 2048) {
    errors.logoUrl = "Logo must be 2048 characters or fewer.";
  } else if (values.logoUrl !== "" && !isAllowedLogoValue(values.logoUrl)) {
    errors.logoUrl = "Logo must be an http(s) URL or an app-relative path.";
  }

  if (values.contactPhone.length > 40) {
    errors.contactPhone = "Report phone must be 40 characters or fewer.";
  }

  if (values.contactEmail.length > 320) {
    errors.contactEmail = "Report email must be 320 characters or fewer.";
  } else if (values.contactEmail !== "" && !emailPattern.test(values.contactEmail)) {
    errors.contactEmail = "Report email must be a valid email address.";
  }

  if (values.contactWebsite.length > 2048) {
    errors.contactWebsite = "Report website must be 2048 characters or fewer.";
  } else if (
    values.contactWebsite !== "" &&
    !isHttpUrl(values.contactWebsite)
  ) {
    errors.contactWebsite = "Report website must be an http(s) URL.";
  }

  if (values.contactAddress.length > 1000) {
    errors.contactAddress = "Report address must be 1000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return {
    ok: true,
    data: {
      displayName: values.displayName,
      logoUrl: optionalValue(values.logoUrl),
      primaryBrandColor: values.primaryBrandColor.toLowerCase(),
      contactPhone: optionalValue(values.contactPhone),
      contactEmail: optionalValue(values.contactEmail),
      contactWebsite: optionalValue(values.contactWebsite),
      contactAddress: optionalValue(values.contactAddress),
    },
  };
}
