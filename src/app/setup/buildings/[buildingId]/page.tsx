import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getBuilding,
  getBuildingInspectionPlan,
  listAreas,
} from "@/lib/client-building-setup/repository";
import { summarizeBuildingInspectionPlanEntryCounts } from "@/lib/client-building-setup/model";

import { archiveBuildingAction, restoreBuildingAction } from "../actions";
import { BuildingEditForm } from "../building-form";

type BuildingDetailPageProps = {
  params: Promise<{ buildingId: string }>;
};

function areaStatus(area: Awaited<ReturnType<typeof listAreas>>[number]): string {
  if (area.isArchived) {
    return "Archived";
  }

  if (area.isClientArchived) {
    return "Inactive while parent Client is archived";
  }

  if (area.isBuildingArchived) {
    return "Inactive while parent Building is archived";
  }

  if (area.isAreaTypeArchived) {
    return "Inactive while Area Type is archived";
  }

  return "Active";
}

function statusLabel(building: NonNullable<Awaited<ReturnType<typeof getBuilding>>>): string {
  if (building.isArchived) {
    return "Archived";
  }

  if (building.isParentArchived) {
    return "Restored but inactive while parent Client is archived";
  }

  return "Active";
}

function buildingInspectionPlanDescription(
  plan: Awaited<ReturnType<typeof getBuildingInspectionPlan>>,
): string {
  if (!plan) {
    return "No plan configured yet";
  }

  const summary = summarizeBuildingInspectionPlanEntryCounts(plan.entries);

  if (summary.isConfigured) {
    const pairLabel = summary.activeEntryCount === 1 ? "pair" : "pairs";
    if (summary.staleEntryCount > 0) {
      return `${summary.activeEntryCount} active Area/template ${pairLabel} · ${summary.staleEntryCount} inactive`;
    }

    return `${summary.activeEntryCount} active Area/template ${pairLabel} configured`;
  }

  if (summary.entryCount > 0) {
    const pairLabel = summary.entryCount === 1 ? "pair" : "pairs";
    return `${summary.entryCount} saved ${pairLabel} · all inactive`;
  }

  return "No plan configured yet";
}

export default async function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { buildingId } = await params;
  const building = await getBuilding(buildingId);

  if (!building) {
    notFound();
  }

  const [areas, inspectionPlan] = await Promise.all([
    listAreas({
      visibility: "historical",
      buildingId: building.id,
    }),
    getBuildingInspectionPlan(building.id),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup/buildings">
            ← Buildings
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {statusLabel(building)}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {building.name}
            </h1>
            <p className="text-muted-ink">
              Client: {" "}
              <Link
                className="font-semibold text-brand-700"
                href={`/setup/clients/${building.clientId}`}
              >
                {building.clientName}
              </Link>
            </p>
          </div>
        </div>

        {building.isParentArchived && !building.isArchived ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            This Building is restored, but it remains inactive for new workflows
            until its parent Client is restored.
          </p>
        ) : null}

        <BuildingEditForm building={building} />

        <form action={building.isArchived ? restoreBuildingAction : archiveBuildingAction}>
          <input name="id" type="hidden" value={building.id} />
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="submit"
          >
            {building.isArchived ? "Restore Building" : "Archive Building"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Building Inspection Plan
              </h2>
              <p className="mt-1 text-sm text-muted-ink">
                {buildingInspectionPlanDescription(inspectionPlan)}
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={`/setup/building-inspection-plans/${building.id}`}
            >
              Manage plan
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Areas</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/setup/areas">
              Manage Areas
            </Link>
          </div>

          {areas.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Areas have been set up for this Building.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {areas.map((area) => (
                <li key={area.id}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/areas/${area.id}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {area.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {area.areaTypeName} · {areaStatus(area)}
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
