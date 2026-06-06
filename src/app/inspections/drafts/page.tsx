import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireProtectedAction } from "@/lib/auth/session";
import { listBuildingInspectionPlanSummaries } from "@/lib/client-building-setup/repository";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageBandHeading,
  PageEmptyState,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

import { StartDraftInspectionButton } from "./start-draft-inspection-button";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getPlanBadge(
  summary: Awaited<ReturnType<typeof listBuildingInspectionPlanSummaries>>[number],
  hasActiveDraft: boolean,
) {
  if (hasActiveDraft) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-amber-800 uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Draft active
      </span>
    );
  }
  if (!summary.isConfigured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-slate-700 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Needs Plan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-emerald-200/50 bg-brand-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-brand-emerald-800 uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald-500" />
      {summary.activeEntryCount} {summary.activeEntryCount === 1 ? "pair" : "pairs"} ready
    </span>
  );
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
    <AppPage>
      <AppPageHero
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Active Drafts are work in progress and are not reportable until submitted."
        eyebrow="Work in Progress"
        title="Draft"
        titleAccent="Inspections"
      />

      <AppPageBody className="gap-8 pt-2 lg:grid lg:grid-cols-12" overlap="flush">
        <section aria-labelledby="active-drafts-heading" className="space-y-6 lg:col-span-7">
          <PageBandHeading
            count={activeDrafts.length}
            heading="Active Drafts"
            headingId="active-drafts-heading"
            icon="list"
          />

          {activeDrafts.length === 0 ? (
            <PageEmptyState
              description="There are no drafts currently in progress. Start a new draft inspection from the sidebar."
              icon="draft"
              title="No active drafts"
            />
          ) : (
            <div className="grid gap-4">
              {activeDrafts.map((draft) => {
                const percent =
                  draft.itemCount > 0
                    ? Math.round((draft.answeredItemCount / draft.itemCount) * 100)
                    : 0;

                return (
                  <article
                    className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md"
                    key={draft.id}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-display text-base font-bold text-slate-950">
                            {draft.buildingNameSnapshot}
                          </h3>
                          <p className="inline-block rounded-md bg-brand-forest-50 px-2 py-0.5 text-xs font-medium text-brand-forest-700">
                            {draft.clientNameSnapshot}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-muted-ink">
                        <div className="flex items-center gap-2">
                          <Glyph className="size-3.5 text-slate-400" name="user" />
                          <span>
                            Started by{" "}
                            <span className="font-medium text-slate-700">{draft.startedByEmail}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Glyph className="size-3.5 text-slate-400" name="clock" />
                          <span>Started {formatDateTime(draft.startedAt)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">Inspection progress</span>
                          <span className="font-display font-semibold text-slate-950 tabular-nums">
                            {percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-forest-700 to-brand-emerald-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-[0.7rem] text-slate-500">
                          {draft.areaInspectionCount} area inspections · {draft.answeredItemCount} of{" "}
                          {draft.itemCount} items answered
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                      {canEditDrafts ? (
                        <Link
                          className={`${ux.primaryButton} gap-1.5`}
                          href={`/inspections/drafts/${draft.id}`}
                        >
                          Continue Draft
                          <Glyph className="size-3.5" name="arrow" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <Glyph className="size-3.5 text-slate-400" name="info" />
                          Read-only metadata
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {canEditDrafts ? (
          <section aria-labelledby="start-drafts-heading" className="space-y-6 lg:col-span-5">
            <PageBandHeading
              count={planSummaries.length}
              heading="Start a Draft"
              headingId="start-drafts-heading"
              icon="plus"
            />

            {planSummaries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 text-center shadow-sm">
                <p className="text-sm text-muted-ink">No active Buildings found.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {planSummaries.map((summary) => {
                  const hasActiveDraft = activeDraftBuildingIds.has(summary.buildingId);

                  return (
                    <article
                      className="group rounded-2xl border border-slate-200/70 bg-white p-4.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                      key={summary.buildingId}
                    >
                      <div className="flex flex-col gap-3.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-slate-950">
                              {summary.buildingName}
                            </h3>
                            {getPlanBadge(summary, hasActiveDraft)}
                          </div>
                          <p className="text-xs text-muted-ink">{summary.clientName}</p>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-3">
                          {hasActiveDraft ? (
                            <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400">
                              Active Draft in list
                            </span>
                          ) : summary.isConfigured ? (
                            <StartDraftInspectionButton
                              buildingId={summary.buildingId}
                              buildingName={summary.buildingName}
                            />
                          ) : (
                            <Link
                              className={`${ux.secondaryButton} gap-1 px-3.5 py-2 text-xs`}
                              href={`/setup/building-inspection-plans/${summary.buildingId}`}
                            >
                              Configure plan
                              <Glyph className="size-3.5" name="arrow" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </AppPageBody>
    </AppPage>
  );
}
