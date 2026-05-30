import Link from "next/link";

import { signOutInternalUser } from "@/lib/auth/actions";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/dashboard/repository";
import { resolveDateRange } from "@/lib/date-ranges";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-muted-ink">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? `${Math.max(8, Math.round((value / max) * 100))}%` : "0%";

  return (
    <li className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="font-semibold text-slate-950">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-3 rounded-full bg-brand-700" style={{ width }} />
      </div>
    </li>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const range = resolveDateRange({
    preset: params?.range,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
  const user = await requireInternalUser();
  const canViewActiveDraftMetadata = canPerformProtectedAction(
    user.capabilities,
    "viewActiveDraftMetadata",
  );
  const canEditDrafts = canPerformProtectedAction(
    user.capabilities,
    "editDraftInspection",
  );
  const [metrics, activeDrafts] = await Promise.all([
    getDashboardMetrics({ startAt: range.startAt, endBefore: range.endBefore }),
    canViewActiveDraftMetadata ? listActiveDraftInspections() : Promise.resolve([]),
  ]);
  const resultMax = Math.max(
    metrics.inspectionResultCounts.pass,
    metrics.inspectionResultCounts.fail,
    metrics.inspectionResultCounts.notApplicable,
  );
  const buildingMax = Math.max(
    0,
    ...metrics.openTicketsByBuilding.map((building) => building.openTicketCount),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-5xl space-y-6 rounded-card border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Internal workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="text-muted-ink">Signed in as {user.email}</p>
          </div>
          <form action={signOutInternalUser}>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>

        <form className="grid gap-4 rounded-2xl border border-slate-200 p-5 md:grid-cols-5">
          <label className="space-y-2 md:col-span-2" htmlFor="dashboard-range">
            <span className="text-sm font-semibold text-slate-900">Dashboard range</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={range.preset === "custom" ? "custom" : range.preset}
              id="dashboard-range"
              name="range"
            >
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>
          <label className="space-y-2" htmlFor="dashboard-start-date">
            <span className="text-sm font-semibold text-slate-900">Start date</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={range.startDateInput}
              id="dashboard-start-date"
              name="startDate"
              type="date"
            />
          </label>
          <label className="space-y-2" htmlFor="dashboard-end-date">
            <span className="text-sm font-semibold text-slate-900">End date</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={range.endDateInput}
              id="dashboard-end-date"
              name="endDate"
              type="date"
            />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <button
              className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type="submit"
            >
              Apply
            </button>
            <Link className="py-3 text-sm font-semibold text-brand-700" href="/dashboard">
              Reset
            </Link>
          </div>
          {!range.isCustomValid ? (
            <p className="text-sm text-red-700 md:col-span-5">
              Custom range was invalid, so the dashboard is showing This Week.
            </p>
          ) : null}
        </form>

        <section className="space-y-4 rounded-2xl border border-slate-200 p-5" aria-labelledby="dashboard-reportable-heading">
          <div>
            <h2 id="dashboard-reportable-heading" className="text-xl font-semibold text-slate-950">
              Reportable metrics · {range.label}
            </h2>
            <p className="mt-1 text-sm text-muted-ink">
              Charts use Submitted Inspections and their Tickets only. Draft Inspection data is excluded.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Open Tickets" value={metrics.ticketStatusCounts.open} />
            <MetricCard label="Closed Tickets" value={metrics.ticketStatusCounts.closed} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Inspection Result breakdown</h3>
              {resultMax === 0 ? (
                <p className="mt-3 text-sm text-muted-ink">
                  No Submitted Inspection results in this range.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  <BarRow label="Pass" value={metrics.inspectionResultCounts.pass} max={resultMax} />
                  <BarRow label="Fail" value={metrics.inspectionResultCounts.fail} max={resultMax} />
                  <BarRow label="N/A" value={metrics.inspectionResultCounts.notApplicable} max={resultMax} />
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Open Tickets by Building</h3>
              {metrics.openTicketsByBuilding.length === 0 ? (
                <p className="mt-3 text-sm text-muted-ink">
                  No Open Tickets by Building in this range.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {metrics.openTicketsByBuilding.map((building) => (
                    <BarRow
                      key={building.buildingId}
                      label={building.buildingName}
                      value={building.openTicketCount}
                      max={buildingMax}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <h2 className="font-semibold text-brand-800">Capabilities</h2>
          <p className="mt-2 text-sm text-brand-700">
            {user.capabilities.join(", ")}
          </p>
        </div>

        {canViewActiveDraftMetadata ? (
          <section
            className="space-y-4 rounded-2xl border border-slate-200 p-5"
            aria-labelledby="active-draft-inspections-heading"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="active-draft-inspections-heading"
                  className="text-xl font-semibold text-slate-950"
                >
                  Active Draft Inspections
                </h2>
                <p className="mt-1 text-sm text-muted-ink">
                  Drafts are shown separately from completed and reportable inspection data.
                </p>
              </div>
              <Link className="text-sm font-semibold text-brand-700" href="/inspections/drafts">
                View all Drafts
              </Link>
            </div>

            {activeDrafts.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
                No active Draft Inspections.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {activeDrafts.map((draft) => (
                  <li
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
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
        ) : null}
      </section>
    </main>
  );
}
