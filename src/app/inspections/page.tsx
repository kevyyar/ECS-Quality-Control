import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import {
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";
import { listInspections } from "@/lib/inspections/repository";
import type { InspectionWeekFilter } from "@/lib/inspections/repository";

type InspectionsPageProps = {
  searchParams?: Promise<{
    clientId?: string;
    buildingId?: string;
    status?: string;
    inspectionWeek?: string;
  }>;
};

type FilterOption = {
  id: string;
  name: string;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function validStatus(value: string | undefined): "all" | "draft" | "submitted" {
  return value === "draft" || value === "submitted" ? value : "all";
}

function validWeek(value: string | undefined): InspectionWeekFilter {
  if (value === "this-week" || value === "last-week" || value === "this-month") {
    return value;
  }

  return "all";
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: FilterOption[];
  value: string | undefined;
}) {
  return (
    <label className="space-y-2" htmlFor={`inspection-filter-${name}`}>
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        defaultValue={value ?? ""}
        id={`inspection-filter-${name}`}
        name={name}
      >
        <option value="">All {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function InspectionsPage({ searchParams }: InspectionsPageProps) {
  const user = await requireInternalUser();
  const params = await searchParams;
  const canViewDraftMetadata = canPerformProtectedAction(
    user.capabilities,
    "viewActiveDraftMetadata",
  );
  const canEditDrafts = canPerformProtectedAction(
    user.capabilities,
    "editDraftInspection",
  );
  const requestedStatus = validStatus(params?.status);
  const status = canViewDraftMetadata ? requestedStatus : "submitted";
  const inspectionWeek = validWeek(params?.inspectionWeek);
  const [clients, buildings, inspections] = await Promise.all([
    listClients({ visibility: "historical" }),
    listBuildings({
      visibility: "historical",
      clientId: params?.clientId,
    }),
    listInspections({
      clientId: params?.clientId,
      buildingId: params?.buildingId,
      status,
      inspectionWeek,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-6xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/">
            ← Home
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
                Inspections
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Inspection list
              </h1>
              <p className="text-muted-ink">
                Review Draft and Submitted Inspections by Client, Building, and Inspection Week.
              </p>
            </div>
            <Link className="text-sm font-semibold text-brand-700" href="/inspections/drafts">
              {canEditDrafts ? "Start or manage Draft Inspections" : "View Draft Inspection metadata"}
            </Link>
          </div>
        </div>

        <form className="grid gap-4 rounded-2xl border border-slate-200 p-5 lg:grid-cols-5">
          <FilterSelect
            label="Clients"
            name="clientId"
            options={clients.map((client) => ({ id: client.id, name: client.name }))}
            value={params?.clientId}
          />
          <FilterSelect
            label="Buildings"
            name="buildingId"
            options={buildings.map((building) => ({ id: building.id, name: building.name }))}
            value={params?.buildingId}
          />
          <label className="space-y-2" htmlFor="inspection-filter-status">
            <span className="text-sm font-semibold text-slate-900">Status</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={status === "all" ? "" : status}
              id="inspection-filter-status"
              name="status"
            >
              <option value="">All Statuses</option>
              {canViewDraftMetadata ? <option value="draft">Draft</option> : null}
              <option value="submitted">Submitted</option>
            </select>
          </label>
          <label className="space-y-2" htmlFor="inspection-filter-week">
            <span className="text-sm font-semibold text-slate-900">Inspection Week</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={inspectionWeek === "all" ? "" : inspectionWeek}
              id="inspection-filter-week"
              name="inspectionWeek"
            >
              <option value="">All Weeks</option>
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <button
              className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type="submit"
            >
              Apply filters
            </button>
            <Link className="py-3 text-sm font-semibold text-brand-700" href="/inspections">
              Clear
            </Link>
          </div>
        </form>

        {inspections.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
            No Inspections found.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200" aria-label="Inspections">
            {inspections.map((inspection) => (
              <li key={inspection.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-950">
                        {inspection.buildingName}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {inspection.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-ink">
                      {inspection.clientName} · Started {formatDateTime(inspection.startedAt)} by {inspection.startedByEmail}
                    </p>
                    {inspection.submittedAt ? (
                      <p className="text-sm text-muted-ink">
                        Submitted {formatDateTime(inspection.submittedAt)} by {inspection.submittedByEmail}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-ink">
                      {inspection.areaInspectionCount} area inspections · {inspection.itemCount} items
                    </p>
                  </div>
                  {inspection.status === "draft" ? (
                    canEditDrafts ? (
                      <Link
                        className="rounded-xl bg-brand-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        href={`/inspections/drafts/${inspection.id}`}
                      >
                        Continue
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        Read-only metadata
                      </span>
                    )
                  ) : (
                    <Link
                      className="rounded-xl border border-brand-700 px-4 py-2 text-center text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      href={`/inspections/${inspection.id}`}
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
