import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";

export default async function SetupPage() {
  await requireProtectedAction("manageSetup");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-3xl space-y-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Setup management
          </h1>
          <p className="text-muted-ink">
            Manage shared setup records for the Janitorial Company.
          </p>
        </div>

        <Link
          className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          href="/company-branding"
        >
          <span className="block text-lg font-semibold">Company Branding</span>
          <span className="mt-2 block text-sm">
            Configure the shared identity used by the app and future PDF reports.
          </span>
        </Link>
      </section>
    </main>
  );
}
