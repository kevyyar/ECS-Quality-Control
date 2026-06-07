import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import {
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";
import { listInspections } from "@/lib/inspections/repository";
import type { InspectionWeekFilter } from "@/lib/inspections/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageBandHeading,
  PageEmptyState,
  PageSection,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

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
    <label className={ux.formField} htmlFor={`inspection-filter-${name}`}>
      <span className={ux.fieldLabel}>{label}</span>
      <select
        className={ux.select}
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

function StatusBadge({ status }: { status: "draft" | "submitted" }) {
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-amber-800 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Draft
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/60 bg-sky-50 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-sky-800 uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
      Submitted
    </span>
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

  const submittedCount = inspections.filter((inspection) => inspection.status === "submitted").length;
  const draftCount = inspections.filter((inspection) => inspection.status === "draft").length;
  const hasActiveFilters = Boolean(
    params?.clientId ||
      params?.buildingId ||
      (canViewDraftMetadata && params?.status) ||
      params?.inspectionWeek,
  );

  return (
    <AppPage>
      <AppPageHero
        actions={
          <Link className={ux.heroAction} href="/inspections/drafts">
            <Glyph className="size-4" name="draft" />
            {canEditDrafts ? "Start or manage Draft Inspections" : "View Draft Inspection metadata"}
          </Link>
        }
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Review Draft and Submitted Inspections by Client, Building, and Inspection Week."
        eyebrow="Quality Records"
        title="Inspection"
        titleAccent="list"
      />

      <AppPageBody>
        <PageSection
          badge={hasActiveFilters ? <span className={ux.activeFilterBadge}>Active</span> : null}
          headerAside={
            <p className="text-xs text-muted-ink">
              {inspections.length} {inspections.length === 1 ? "result" : "results"}
              {canViewDraftMetadata && inspections.length > 0
                ? ` · ${submittedCount} submitted · ${draftCount} draft`
                : null}
            </p>
          }
          heading="Filters"
          headingId="inspection-filters-heading"
          icon="filter"
        >
          <form className="grid gap-4 lg:grid-cols-5">
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
            <label className={ux.formField} htmlFor="inspection-filter-status">
              <span className={ux.fieldLabel}>Status</span>
              <select
                className={ux.select}
                defaultValue={status === "all" ? "" : status}
                id="inspection-filter-status"
                name="status"
              >
                <option value="">All Statuses</option>
                {canViewDraftMetadata ? <option value="draft">Draft</option> : null}
                <option value="submitted">Submitted</option>
              </select>
            </label>
            <label className={ux.formField} htmlFor="inspection-filter-week">
              <span className={ux.fieldLabel}>Inspection Week</span>
              <select
                className={ux.select}
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
            <div className={ux.searchActions}>
              <button className={ux.primaryButton} type="submit">
                Apply filters
              </button>
              <Link className={ux.textLink} href="/inspections">
                Clear
              </Link>
            </div>
          </form>
        </PageSection>

        <section aria-labelledby="inspection-results-heading">
          <PageBandHeading
            count={inspections.length}
            heading="Results"
            headingId="inspection-results-heading"
            icon="list"
          />

          {inspections.length === 0 ? (
            <PageEmptyState
              action={
                hasActiveFilters ? (
                  <Link className={ux.secondaryButton} href="/inspections">
                    Clear filters
                  </Link>
                ) : canEditDrafts ? (
                  <Link className={`${ux.primaryButton} gap-1.5`} href="/inspections/drafts">
                    Start a Draft Inspection
                    <Glyph className="size-3.5" name="arrow" />
                  </Link>
                ) : undefined
              }
              description={
                hasActiveFilters
                  ? "Try adjusting your filters or clearing them to see more results."
                  : "Inspections will appear here once supervisors start or submit them."
              }
              icon="list"
              title="No Inspections found"
            />
          ) : (
            <ul aria-label="Inspections" className="grid gap-4">
              {inspections.map((inspection) => (
                <li key={inspection.id}>
                  <article className={ux.recordCard}>
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-base font-bold text-slate-950">
                          {inspection.buildingName}
                        </h3>
                        <StatusBadge status={inspection.status} />
                      </div>

                      <p className="inline-block rounded-md bg-brand-forest-50 px-2 py-0.5 text-xs font-medium text-brand-forest-700">
                        {inspection.clientName}
                      </p>

                      <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-muted-ink">
                        <div className="flex items-center gap-2">
                          <Glyph className="size-3.5 text-slate-400" name="clock" />
                          <span>
                            Started {formatDateTime(inspection.startedAt)} by{" "}
                            <span className="font-medium text-slate-700">
                              {inspection.startedByEmail}
                            </span>
                          </span>
                        </div>
                        {inspection.submittedAt ? (
                          <div className="flex items-center gap-2">
                            <Glyph className="size-3.5 text-slate-400" name="check" />
                            <span>
                              Submitted {formatDateTime(inspection.submittedAt)} by{" "}
                              <span className="font-medium text-slate-700">
                                {inspection.submittedByEmail}
                              </span>
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Glyph className="size-3.5 text-slate-400" name="building" />
                          <span>
                            {inspection.areaInspectionCount} area inspections · {inspection.itemCount} items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                      {inspection.status === "draft" ? (
                        canEditDrafts ? (
                          <Link
                            className={`${ux.primaryButton} w-full gap-1.5 sm:w-auto`}
                            href={`/inspections/drafts/${inspection.id}`}
                          >
                            Continue Draft
                            <Glyph className="size-3.5" name="arrow" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Read-only metadata
                          </span>
                        )
                      ) : (
                        <Link
                          className={`${ux.secondaryButton} w-full gap-1.5 sm:w-auto`}
                          href={`/inspections/${inspection.id}`}
                        >
                          View Inspection
                          <Glyph className="size-3.5" name="arrow" />
                        </Link>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AppPageBody>
    </AppPage>
  );
}
