"use client";

import { useActionState } from "react";

import type { CompanyBranding } from "@/lib/company-branding/model";

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
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2" htmlFor="displayName">
          <span className="text-sm font-semibold text-slate-900">
            Company display name
          </span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "displayName")}
            id="displayName"
            name="displayName"
            required
          />
          <FieldError message={fieldError(state, "displayName")} />
        </label>

        <label className="space-y-2" htmlFor="logoFile">
          <span className="text-sm font-semibold text-slate-900">
            Company logo
          </span>
          <input
            name="logoUrl"
            readOnly
            type="hidden"
            value={currentLogoUrl}
          />
          <input
            accept="image/png,image/jpeg,image/webp"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-brand-700">
                  Logo
                </span>
                <p className="min-w-0 truncate text-sm text-slate-600">
                  Current logo: {currentLogoUrl}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  className="size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-100"
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

        <label className="space-y-2" htmlFor="primaryBrandColor">
          <span className="text-sm font-semibold text-slate-900">
            Primary brand color
          </span>
          <input
            className="h-12 w-full rounded-xl border border-slate-300 px-2 py-1 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "primaryBrandColor")}
            id="primaryBrandColor"
            name="primaryBrandColor"
            required
            type="color"
          />
          <FieldError message={fieldError(state, "primaryBrandColor")} />
        </label>
      </div>

      <fieldset className="grid gap-5 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Optional report contact details
        </legend>

        <label className="space-y-2" htmlFor="contactPhone">
          <span className="text-sm font-semibold text-slate-900">Phone</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "contactPhone")}
            id="contactPhone"
            name="contactPhone"
          />
          <FieldError message={fieldError(state, "contactPhone")} />
        </label>

        <label className="space-y-2" htmlFor="contactEmail">
          <span className="text-sm font-semibold text-slate-900">Email</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "contactEmail")}
            id="contactEmail"
            name="contactEmail"
            type="email"
          />
          <FieldError message={fieldError(state, "contactEmail")} />
        </label>

        <label className="space-y-2" htmlFor="contactWebsite">
          <span className="text-sm font-semibold text-slate-900">Website</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "contactWebsite")}
            id="contactWebsite"
            name="contactWebsite"
            type="url"
          />
          <FieldError message={fieldError(state, "contactWebsite")} />
        </label>

        <label className="space-y-2 sm:col-span-2" htmlFor="contactAddress">
          <span className="text-sm font-semibold text-slate-900">Address</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={fieldValue(state, branding, "contactAddress")}
            id="contactAddress"
            name="contactAddress"
          />
          <FieldError message={fieldError(state, "contactAddress")} />
        </label>
      </fieldset>

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Save Company Branding"}
      </button>
    </form>
  );
}
