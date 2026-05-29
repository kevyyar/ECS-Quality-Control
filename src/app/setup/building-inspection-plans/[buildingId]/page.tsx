import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getBuilding,
  getBuildingInspectionPlan,
  listAreas,
  listInspectionTemplates,
} from "@/lib/client-building-setup/repository";

import { BuildingInspectionPlanForm } from "../building-inspection-plan-form";

type BuildingInspectionPlanDetailPageProps = {
  params: Promise<{ buildingId: string }>;
};

function buildingStatus(building: NonNullable<Awaited<ReturnType<typeof getBuilding>>>): string {
  if (building.isArchived) {
    return "Archived Building";
  }

  if (building.isParentArchived) {
    return "Inactive while parent Client is archived";
  }

  return "Active Building";
}

export default async function BuildingInspectionPlanDetailPage({
  params,
}: BuildingInspectionPlanDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { buildingId } = await params;
  const building = await getBuilding(buildingId);

  if (!building) {
    notFound();
  }

  const [plan, activeAreas, activeTemplates] = await Promise.all([
    getBuildingInspectionPlan(building.id),
    listAreas({ visibility: "active", buildingId: building.id }),
    listInspectionTemplates({ visibility: "active" }),
  ]);

  const canEdit = building.isActive && activeAreas.length > 0 && activeTemplates.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link
            className="text-sm font-semibold text-brand-700"
            href="/setup/building-inspection-plans"
          >
            ← Building Inspection Plans
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {buildingStatus(building)}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {building.name} Inspection Plan
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

        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-muted-ink">
          Plan changes affect future Draft Inspections only. Existing Draft and Submitted Inspections keep the plan content captured when they were created.
        </p>

        {!building.isActive ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            This Building is inactive. Restore the Building and its parent Client before
            editing its Building Inspection Plan.
          </p>
        ) : null}

        {building.isActive && activeAreas.length === 0 ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Create or restore at least one active Area for this Building before editing
            its Building Inspection Plan.
          </p>
        ) : null}

        {building.isActive && activeTemplates.length === 0 ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Create or restore at least one active Inspection Template before editing
            this Building Inspection Plan.
          </p>
        ) : null}

        {canEdit ? (
          <BuildingInspectionPlanForm
            activeAreas={activeAreas}
            activeTemplates={activeTemplates}
            buildingId={building.id}
            plan={plan}
          />
        ) : null}

        {plan ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-950">Current plan</h2>
            <ol className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {plan.entries
                .slice()
                .sort((first, second) => first.position - second.position)
                .map((entry) => (
                  <li className="p-5" key={entry.id}>
                    <div className="font-semibold text-slate-950">
                      {entry.position}. {entry.areaName}
                    </div>
                    <div className="mt-1 text-sm text-muted-ink">
                      {entry.inspectionTemplateName} · {entry.isActive ? "Active" : "Needs active replacement"}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        ) : null}
      </section>
    </main>
  );
}
