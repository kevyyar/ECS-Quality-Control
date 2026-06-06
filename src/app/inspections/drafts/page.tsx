import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireProtectedAction } from "@/lib/auth/session";
import { listBuildingInspectionPlanSummaries } from "@/lib/client-building-setup/repository";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";

import { StartDraftInspectionButton } from "./start-draft-inspection-button";

/* ────────── Icons (inline SVG, currentColor) ────────── */
function Icon({ d, className }: { d: string; className?: string | undefined }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  arrowLeft: "M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18",
  arrow: "M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
  draft: "M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L19.862 7.487m-3-3L6.375 17.963a4.5 4.5 0 0 1-1.682 1.182L2.5 20.25l1.104-2.193a4.5 4.5 0 0 1 1.182-1.682l10.5-10.5m-2.424 2.424 2.424 2.424",
  building: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  list: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z",
  plus: "M12 4.5v15m7.5-7.5h-15",
  check: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  user: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
  info: "M11.25 11.25l.041-.02a.75.75 0 111.086 1.086L12 12.75l-.041.02a.75.75 0 11-1.086-1.086l.327-.327zM12 21a9 9 0 100-18 9 9 0 000 18z"
} as const;

type IconKey = keyof typeof ICONS;

function Glyph({ name, className }: { name: IconKey; className?: string }) {
  return <Icon className={className} d={ICONS[name]} />;
}

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
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-ink">
      {/* Soft background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklch, var(--color-brand-emerald-300) 18%, transparent), transparent 60%), radial-gradient(ellipse 60% 40% at 0% 0%, color-mix(in oklch, var(--color-brand-forest-300) 12%, transparent), transparent 50%)",
        }}
      />

      {/* Hero / Identity Strip */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand-forest-950 via-brand-forest-800 to-brand-forest-700"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, color-mix(in oklch, var(--color-brand-emerald-500) 28%, transparent) 0%, transparent 45%), radial-gradient(circle at 82% 78%, color-mix(in oklch, var(--color-brand-emerald-400) 22%, transparent) 0%, transparent 50%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-10 sm:px-10 lg:pb-16 lg:pt-14">
          <div className="space-y-4">
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-emerald-300 hover:text-brand-emerald-200 transition"
              href="/dashboard"
            >
              <Glyph className="size-4" name="arrowLeft" />
              Back to Dashboard
            </Link>
            
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald-400 shadow-[0_0_8px_var(--color-brand-emerald-400)] animate-pulse" />
                Work in Progress
              </p>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Draft <span className="text-brand-emerald-300">Inspections</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/70">
                Active Drafts are work in progress and are not reportable until submitted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Canvas Grid */}
      <div className="relative mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-12 pt-2">
          
          {/* Active Drafts Column */}
          <section className="lg:col-span-7 space-y-6" aria-labelledby="active-drafts-heading">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-forest-800 text-brand-emerald-300 shadow-sm">
                  <Glyph className="size-4.5" name="list" />
                </div>
                <h2 id="active-drafts-heading" className="font-display text-lg font-bold text-slate-900">
                  Active Drafts
                </h2>
                <span className="inline-flex items-center justify-center rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {activeDrafts.length}
                </span>
              </div>
            </div>

            {activeDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/85 px-6 py-12 text-center shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                  <Glyph className="size-6" name="draft" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-slate-900">
                    No active drafts
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-ink">
                    There are no drafts currently in progress. Start a new draft inspection from the sidebar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeDrafts.map((draft) => {
                  const percent = draft.itemCount > 0 
                    ? Math.round((draft.answeredItemCount / draft.itemCount) * 100) 
                    : 0;

                  return (
                    <article
                      key={draft.id}
                      className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md"
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-display text-base font-bold text-slate-950">
                              {draft.buildingNameSnapshot}
                            </h3>
                            <p className="text-xs font-medium text-brand-forest-700 bg-brand-forest-50 inline-block px-2 py-0.5 rounded-md">
                              {draft.clientNameSnapshot}
                            </p>
                          </div>
                        </div>

                        {/* Metadata Details */}
                        <div className="grid gap-2 text-xs text-muted-ink border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-2">
                            <Glyph className="size-3.5 text-slate-400" name="user" />
                            <span>Started by <span className="font-medium text-slate-700">{draft.startedByEmail}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Glyph className="size-3.5 text-slate-400" name="clock" />
                            <span>Started {formatDateTime(draft.startedAt)}</span>
                          </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">Inspection progress</span>
                            <span className="font-display font-semibold text-slate-950 tabular-nums">{percent}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-forest-700 to-brand-emerald-500 transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[0.7rem] text-slate-500">
                            {draft.areaInspectionCount} area inspections · {draft.answeredItemCount} of {draft.itemCount} items answered
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                        {canEditDrafts ? (
                          <Link
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-forest-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-forest-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400"
                            href={`/inspections/drafts/${draft.id}`}
                          >
                            Continue Draft
                            <Glyph className="size-3.5" name="arrow" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
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

          {/* Start a Draft Column */}
          {canEditDrafts ? (
            <section className="lg:col-span-5 space-y-6" aria-labelledby="start-drafts-heading">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-emerald-500 text-brand-forest-900 shadow-sm">
                    <Glyph className="size-4.5" name="plus" />
                  </div>
                  <h2 id="start-drafts-heading" className="font-display text-lg font-bold text-slate-900">
                    Start a Draft
                  </h2>
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {planSummaries.length}
                  </span>
                </div>
              </div>

              {planSummaries.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 text-center shadow-sm">
                  <p className="text-sm text-muted-ink">No active Buildings found.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {planSummaries.map((summary) => {
                    const hasActiveDraft = activeDraftBuildingIds.has(summary.buildingId);

                    return (
                      <article
                        key={summary.buildingId}
                        className="group rounded-2xl border border-slate-200/70 bg-white p-4.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-3.5">
                          {/* Info */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="font-display text-sm font-bold text-slate-950">
                                {summary.buildingName}
                              </h3>
                              {getPlanBadge(summary, hasActiveDraft)}
                            </div>
                            <p className="text-xs text-muted-ink">
                              {summary.clientName}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="border-t border-slate-100 pt-3 flex justify-end">
                            {hasActiveDraft ? (
                              <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                                Active Draft in list
                              </span>
                            ) : summary.isConfigured ? (
                              <StartDraftInspectionButton
                                buildingId={summary.buildingId}
                                buildingName={summary.buildingName}
                              />
                            ) : (
                              <Link
                                className="inline-flex items-center justify-center gap-1 rounded-xl border border-brand-forest-800 px-3.5 py-2 text-xs font-semibold text-brand-forest-800 transition hover:bg-brand-forest-50"
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

        </div>
      </div>
    </main>
  );
}
