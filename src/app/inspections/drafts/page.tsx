import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireProtectedAction } from "@/lib/auth/session";
import { listBuildingInspectionPlanSummaries } from "@/lib/client-building-setup/repository";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";

import { StartDraftInspectionButton } from "./start-draft-inspection-button";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function planStatus(
  summary: Awaited<ReturnType<typeof listBuildingInspectionPlanSummaries>>[number],
): string {
  if (!summary.isConfigured) {
    if (summary.entryCount > 0) {
      return "Needs plan update · all pairs inactive";
    }

    return "Needs active Building Inspection Plan";
  }

  const pairLabel = summary.activeEntryCount === 1 ? "active pair" : "active pairs";

  return `${summary.activeEntryCount} ${pairLabel} ready`;
}

export default async function DraftInspectionsPage() {
  const user = await requireProtectedAction("viewActiveDraftMetadata");
  const canEditDrafts = canPerformProtectedAction(
    user.capabilities,
    "editDraftInspection",
  );
  const [activeDrafts, planSummaries] = await Promise.all([
    listActiveDraftInspections(),
    canEditDrafts
      ? listBuildingInspectionPlanSummaries({ visibility: "active" })
      : Promise.resolve([]),
  ]);
  const activeDraftBuildingIds = new Set(
    activeDrafts.map((draft) => draft.buildingId),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-5xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/dashboard">
            ← Dashboard
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Active Draft metadata
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Draft Inspections
            </h1>
            <p className="text-muted-ink">
              Active Drafts are work in progress and are not reportable until submitted.
            </p>
          </div>
        </div>

        <section className="space-y-4" aria-labelledby="active-drafts-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="active-drafts-heading" className="text-xl font-semibold text-slate-950">
                Active Drafts
              </h2>
              <p className="mt-1 text-sm text-muted-ink">
                Managers can view metadata. Supervisors can continue Drafts.
              </p>
            </div>
          </div>

          {activeDrafts.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No active Draft Inspections.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {activeDrafts.map((draft) => (
                <li
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  key={draft.id}
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-950">
                      {draft.buildingNameSnapshot}
                    </h3>
                    <p className="text-sm text-muted-ink">
                      {draft.clientNameSnapshot} · Started {formatDateTime(draft.startedAt)} by {draft.startedByEmail}
                    </p>
                    <p className="text-sm text-muted-ink">
                      {draft.areaInspectionCount} area inspections · {draft.itemCount} items
                    </p>
                  </div>
                  {canEditDrafts ? (
                    <Link
                      className="text-sm font-semibold text-brand-700"
                      href={`/inspections/drafts/${draft.id}`}
                    >
                      Continue
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">
                      Read-only metadata
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {canEditDrafts ? (
          <section className="space-y-4" aria-labelledby="start-drafts-heading">
            <div>
              <h2 id="start-drafts-heading" className="text-xl font-semibold text-slate-950">
                Start a Draft
              </h2>
              <p className="mt-1 text-sm text-muted-ink">
                Supervisors can start one active Draft per Building with a configured active plan.
              </p>
            </div>

            {planSummaries.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
                No active Buildings found.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
                {planSummaries.map((summary) => {
                  const hasActiveDraft = activeDraftBuildingIds.has(summary.buildingId);

                  return (
                    <li
                      className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                      key={summary.buildingId}
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-950">
                          {summary.buildingName}
                        </h3>
                        <p className="text-sm text-muted-ink">
                          {summary.clientName} · {planStatus(summary)}
                        </p>
                      </div>

                      {hasActiveDraft ? (
                        <span className="text-sm font-semibold text-slate-500">
                          Draft already active
                        </span>
                      ) : summary.isConfigured ? (
                        <StartDraftInspectionButton
                          buildingId={summary.buildingId}
                          buildingName={summary.buildingName}
                        />
                      ) : (
                        <Link
                          className="text-sm font-semibold text-brand-700"
                          href={`/setup/building-inspection-plans/${summary.buildingId}`}
                        >
                          Configure plan
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
