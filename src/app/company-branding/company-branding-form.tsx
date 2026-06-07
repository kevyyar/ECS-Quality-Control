"use client";

import { useActionState } from "react";

import type { CompanyBranding } from "@/lib/company-branding/model";
import { ux } from "@/lib/ux/tokens";

import { saveCompanyBranding, type CompanyBrandingActionState } from "./actions";

type CompanyBrandingFormProps = {
  branding: CompanyBranding;
};

const initialState = { status: "idle" } satisfies CompanyBrandingActionState;

function fieldValue(
  state: CompanyBrandingActionState,
  branding: CompanyBranding,
  field: keyof CompanyBranding,
): string {
  if (state.status === "error") {
    return state.values[field];
  }

  return branding[field] ?? "";
}

function fieldError(
  state: CompanyBrandingActionState,
  field: keyof CompanyBranding,
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

export function CompanyBrandingForm({ branding }: CompanyBrandingFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveCompanyBranding,
    initialState,
  );
  const currentLogoUrl = fieldValue(state, branding, "logoUrl");

  return (
    <form action={formAction} className={ux.formStack}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={`${ux.formField} sm:col-span-2`} htmlFor="displayName">
          <span className={ux.fieldLabel}>Company display name</span>
          <input
            className={ux.input}
            defaultValue={fieldValue(state, branding, "displayName")}
            id="displayName"
            name="displayName"
            required
          />
          <FieldError message={fieldError(state, "displayName")} />
        </label>

        <label className={ux.formField} htmlFor="logoFile">
          <span className={ux.fieldLabel}>Company logo</span>
          <input
            name="logoUrl"
            readOnly
            type="hidden"
            value={currentLogoUrl}
          />
          <input
            accept="image/png,image/jpeg,image/webp"
            className={ux.fileInput}
            id="logoFile"
            name="logoFile"
            type="file"
          />
          <p className="text-sm text-muted-ink">
            Upload a PNG, JPG, or WEBP logo up to 2 MB. Saving a new file
            replaces the logo used in future PDF reports.
          </p>
          {currentLogoUrl ? (
            <div className="space-y-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-brand-forest-700">
                  Logo
                </span>
                <p className="min-w-0 truncate text-sm text-slate-600">
                  Current logo: {currentLogoUrl}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  className={ux.checkbox}
                  name="removeCurrentLogo"
                  type="checkbox"
                  value="true"
                />
                Remove current logo on save
              </label>
            </div>
          ) : null}
          <FieldError message={fieldError(state, "logoUrl")} />
        </label>

        <label className={ux.formField} htmlFor="primaryBrandColor">
          <span className={ux.fieldLabel}>Primary brand color</span>
          <input
            className={ux.colorInput}
            defaultValue={fieldValue(state, branding, "primaryBrandColor")}
            id="primaryBrandColor"
            name="primaryBrandColor"
            required
            type="color"
          />
          <FieldError message={fieldError(state, "primaryBrandColor")} />
        </label>
      </div>

      <fieldset className={`${ux.itemWell} sm:grid-cols-2`}>
        <legend className="sr-only">Optional report contact details</legend>
        <p className="text-sm font-semibold text-slate-900 sm:col-span-2">
          Optional report contact details
        </p>

        <label className={ux.formField} htmlFor="contactPhone">
          <span className={ux.fieldLabel}>Phone</span>
          <input
            className={ux.input}
            defaultValue={fieldValue(state, branding, "contactPhone")}
            id="contactPhone"
            name="contactPhone"
          />
          <FieldError message={fieldError(state, "contactPhone")} />
        </label>

        <label className={ux.formField} htmlFor="contactEmail">
          <span className={ux.fieldLabel}>Email</span>
          <input
            className={ux.input}
            defaultValue={fieldValue(state, branding, "contactEmail")}
            id="contactEmail"
            name="contactEmail"
            type="email"
          />
          <FieldError message={fieldError(state, "contactEmail")} />
        </label>

        <label className={ux.formField} htmlFor="contactWebsite">
          <span className={ux.fieldLabel}>Website</span>
          <input
            className={ux.input}
            defaultValue={fieldValue(state, branding, "contactWebsite")}
            id="contactWebsite"
            name="contactWebsite"
            type="url"
          />
          <FieldError message={fieldError(state, "contactWebsite")} />
        </label>

        <label className={`${ux.formField} sm:col-span-2`} htmlFor="contactAddress">
          <span className={ux.fieldLabel}>Address</span>
          <textarea
            className={`${ux.textarea} min-h-28`}
            defaultValue={fieldValue(state, branding, "contactAddress")}
            id="contactAddress"
            name="contactAddress"
          />
          <FieldError message={fieldError(state, "contactAddress")} />
        </label>
      </fieldset>

      {state.status === "success" ? (
        <p className={ux.successMessage}>
          {state.message}
        </p>
      ) : null}

      <div className={ux.formFooter}>
        <button
          className={ux.primaryButton}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save Company Branding"}
        </button>
      </div>
    </form>
  );
}
