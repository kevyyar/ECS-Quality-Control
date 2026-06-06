import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listBuildingInspectionPlanSummaries } from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";
import { ux } from "@/lib/ux/tokens";

type BuildingInspectionPlansPageProps = {
  searchParams?: Promise<{ includeArchived?: string; q?: string }>;
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
    search: params?.q,
  });

  return (
    <SetupListPage
      description="Assign active Areas and Inspection Templates used when starting future Draft Inspections."
      emptyDescription="Search for a Building or include archived records to see more results."
      emptyTitle="No Buildings found"
      listHeading={includeArchived ? "All Buildings" : "Active Buildings"}
      listHeadingId="building-inspection-plans-list-heading"
      records={summaries.map((summary) => ({
        id: summary.buildingId,
        href: `/setup/building-inspection-plans/${summary.buildingId}`,
        title: summary.buildingName,
        meta: summary.clientName,
        subtitle: planStatus(summary),
        actionLabel: "Manage",
      }))}
      searchForm={
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5" htmlFor="plan-search">
            <span className={ux.fieldLabel}>Building name</span>
            <input
              className={ux.input}
              defaultValue={params?.q ?? ""}
              id="plan-search"
              name="q"
              type="search"
            />
          </label>
          {includeArchived ? <input name="includeArchived" type="hidden" value="1" /> : null}
          <div className="flex flex-wrap items-end gap-3">
            <button className={ux.primaryButton} type="submit">
              Search
            </button>
            <Link
              className={`${ux.textLink} py-2.5`}
              href={
                includeArchived
                  ? "/setup/building-inspection-plans?includeArchived=1"
                  : "/setup/building-inspection-plans"
              }
            >
              Clear
            </Link>
          </div>
        </form>
      }
      title="Building Inspection"
      titleAccent="Plans"
      toggleHref={
        includeArchived
          ? "/setup/building-inspection-plans"
          : "/setup/building-inspection-plans?includeArchived=1"
      }
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
