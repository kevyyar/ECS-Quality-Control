import { requireProtectedAction } from "@/lib/auth/session";
import { getCompanyBranding } from "@/lib/company-branding/repository";

import { CompanyBrandingForm } from "./company-branding-form";

export default async function CompanyBrandingPage() {
  await requireProtectedAction("configureBranding");
  const branding = await getCompanyBranding();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-3xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            Setup
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Company Branding
            </h1>
            <p className="text-muted-ink">
              Manage the shared Janitorial Company identity used by the app and
              future PDF reports.
            </p>
          </div>
        </div>

        <CompanyBrandingForm branding={branding} />
      </section>
    </main>
  );
}
