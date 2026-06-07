import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getBuilding,
  getBuildingInspectionPlan,
  listAreas,
  listInspectionTemplates,
} from "@/lib/client-building-setup/repository";
import { PageEmptyState } from "@/lib/ux/app-page";
import {
  SetupDetailPage,
  SetupDetailSection,
} from "@/lib/ux/setup-detail-page";

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
    <SetupDetailPage
      backHref="/setup/building-inspection-plans"
      backLabel="Building Inspection Plans"
      description={
        <>
          Client:{" "}
          <Link className="font-semibold text-brand-emerald-300" href={`/setup/clients/${building.clientId}`}>
            {building.clientName}
          </Link>
        </>
      }
      eyebrow={buildingStatus(building)}
      title={`${building.name} Inspection Plan`}
    >
      <p className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm text-muted-ink shadow-sm">
        Plan changes affect future Draft Inspections only. Existing Draft and Submitted
        Inspections keep the plan content captured when they were created.
      </p>

      {!building.isActive ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          This Building is inactive. Restore the Building and its parent Client before editing
          its Building Inspection Plan.
        </p>
      ) : null}

      {building.isActive && activeAreas.length === 0 ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Create or restore at least one active Area for this Building before editing its
          Building Inspection Plan.
        </p>
      ) : null}

      {building.isActive && activeTemplates.length === 0 ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Create or restore at least one active Inspection Template before editing this
          Building Inspection Plan.
        </p>
      ) : null}

      {canEdit ? (
        <SetupDetailSection heading="Edit plan" headingId="plan-edit-heading" icon="settings">
          <BuildingInspectionPlanForm
            activeAreas={activeAreas}
            activeTemplates={activeTemplates}
            buildingId={building.id}
            plan={plan}
          />
        </SetupDetailSection>
      ) : null}

      {plan ? (
        <SetupDetailSection heading="Current plan" headingId="plan-current-heading" icon="list">
          {plan.entries.length === 0 ? (
            <PageEmptyState
              description="Add Area and Inspection Template pairs to configure this Building's default inspection content."
              icon="list"
              title="No plan entries yet"
            />
          ) : (
            <ol className="grid gap-3">
              {plan.entries
                .slice()
                .sort((first, second) => first.position - second.position)
                .map((entry) => (
                  <li
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5"
                    key={entry.id}
                  >
                    <div className="font-display font-bold text-slate-950">
                      {entry.position}. {entry.areaName}
                    </div>
                    <div className="mt-1 text-sm text-muted-ink">
                      {entry.inspectionTemplateName} ·{" "}
                      {entry.isActive ? "Active" : "Needs active replacement"}
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </SetupDetailSection>
      ) : null}
    </SetupDetailPage>
  );
}
