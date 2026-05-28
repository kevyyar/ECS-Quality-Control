import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listAreaTypes } from "@/lib/client-building-setup/repository";

import { AreaTypeCreateForm } from "./area-type-form";

type AreaTypesPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function statusLabel(isArchived: boolean): string {
  return isArchived ? "Archived" : "Active";
}

export default async function AreaTypesPage({ searchParams }: AreaTypesPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const areaTypes = await listAreaTypes({
    visibility: includeArchived ? "historical" : "active",
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup">
            ← Setup
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Area Types
            </h1>
            <p className="text-muted-ink">
              Manage reusable Area categories. Archived Area Types are hidden
              from active setup lists but remain available for historical context.
            </p>
          </div>
        </div>

        <AreaTypeCreateForm />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Area Types" : "Active Area Types"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={includeArchived ? "/setup/area-types" : "/setup/area-types?includeArchived=1"}
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {areaTypes.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Area Types found.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {areaTypes.map((areaType) => (
                <li key={areaType.id}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/area-types/${areaType.id}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {areaType.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {statusLabel(areaType.isArchived)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-brand-700">View</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
