import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listBuildingInspectionPlanSummaries } from "@/lib/client-building-setup/repository";

type BuildingInspectionPlansPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function planStatus(
  summary: Awaited<ReturnType<typeof listBuildingInspectionPlanSummaries>>[number],
): string {
  if (!summary.isBuildingActive) {
    return "Inactive while parent Client or Building is archived";
  }

  if (!summary.isConfigured) {
    if (summary.entryCount > 0) {
      return "Needs plan update · all pairs inactive";
    }

    return "Needs plan";
  }

  const pairLabel = summary.activeEntryCount === 1 ? "active pair" : "active pairs";

  if (summary.staleEntryCount > 0) {
    const staleLabel = summary.staleEntryCount === 1 ? "inactive pair" : "inactive pairs";
    return `Configured · ${summary.activeEntryCount} ${pairLabel} · ${summary.staleEntryCount} ${staleLabel}`;
  }

  return `Configured · ${summary.activeEntryCount} ${pairLabel}`;
}

export default async function BuildingInspectionPlansPage({
  searchParams,
}: BuildingInspectionPlansPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const summaries = await listBuildingInspectionPlanSummaries({
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
              Building Inspection Plans
            </h1>
            <p className="text-muted-ink">
              Assign active Areas and Inspection Templates used when starting future
              Draft Inspections.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Buildings" : "Active Buildings"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={
                includeArchived
                  ? "/setup/building-inspection-plans"
                  : "/setup/building-inspection-plans?includeArchived=1"
              }
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {summaries.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Buildings found.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {summaries.map((summary) => (
                <li key={summary.buildingId}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/building-inspection-plans/${summary.buildingId}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {summary.buildingName}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {summary.clientName} · {planStatus(summary)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-brand-700">Manage</span>
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
