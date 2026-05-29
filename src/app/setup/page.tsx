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

        <div className="grid gap-4">
          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/clients"
          >
            <span className="block text-lg font-semibold">Clients</span>
            <span className="mt-2 block text-sm">
              Create, edit, archive, and restore service customers.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/buildings"
          >
            <span className="block text-lg font-semibold">Buildings</span>
            <span className="mt-2 block text-sm">
              Manage service locations under active Clients.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/area-types"
          >
            <span className="block text-lg font-semibold">Area Types</span>
            <span className="mt-2 block text-sm">
              Manage reusable Area categories used to organize Areas.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/areas"
          >
            <span className="block text-lg font-semibold">Areas</span>
            <span className="mt-2 block text-sm">
              Manage inspectable spaces under active Buildings.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/inspection-templates"
          >
            <span className="block text-lg font-semibold">Inspection Templates</span>
            <span className="mt-2 block text-sm">
              Manage reusable inspection checklists and starter templates.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/company-branding"
          >
            <span className="block text-lg font-semibold">Company Branding</span>
            <span className="mt-2 block text-sm">
              Configure the shared identity used by the app and future PDF reports.
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
