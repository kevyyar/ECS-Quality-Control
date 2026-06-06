import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getBuilding,
  getBuildingInspectionPlan,
  listAreas,
} from "@/lib/client-building-setup/repository";
import { summarizeBuildingInspectionPlanEntryCounts } from "@/lib/client-building-setup/model";
import {
  PageEmptyState,
  RecordList,
  RecordListItem,
} from "@/lib/ux/app-page";
import {
  SetupDetailPage,
  SetupDetailSection,
} from "@/lib/ux/setup-detail-page";
import { ux } from "@/lib/ux/tokens";

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
    <SetupDetailPage
      backHref="/setup/buildings"
      backLabel="Buildings"
      description={
        <>
          Client:{" "}
          <Link className="font-semibold text-brand-emerald-300" href={`/setup/clients/${building.clientId}`}>
            {building.clientName}
          </Link>
        </>
      }
      eyebrow={statusLabel(building)}
      title={building.name}
    >
      {building.isParentArchived && !building.isArchived ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          This Building is restored, but it remains inactive for new workflows until its parent
          Client is restored.
        </p>
      ) : null}

      <SetupDetailSection heading="Edit Building" headingId="building-edit-heading" icon="building">
        <BuildingEditForm building={building} />
      </SetupDetailSection>

      <SetupDetailSection heading="Archive status" headingId="building-archive-heading" icon="shield">
        <form action={building.isArchived ? restoreBuildingAction : archiveBuildingAction}>
          <input name="id" type="hidden" value={building.id} />
          <button className={ux.mutedButton} type="submit">
            {building.isArchived ? "Restore Building" : "Archive Building"}
          </button>
        </form>
      </SetupDetailSection>

      <SetupDetailSection
        headerAside={
          <Link className={ux.textLink} href={`/setup/building-inspection-plans/${building.id}`}>
            Manage plan
          </Link>
        }
        description={buildingInspectionPlanDescription(inspectionPlan)}
        heading="Building Inspection Plan"
        headingId="building-plan-heading"
        icon="document"
      >
        <p className="text-sm text-muted-ink">
          Plan changes affect future Draft Inspections only. Existing inspections keep the plan
          content captured when they were created.
        </p>
      </SetupDetailSection>

      <SetupDetailSection
        headerAside={
          <Link className={ux.textLink} href="/setup/areas">
            Manage Areas
          </Link>
        }
        heading="Areas"
        headingId="building-areas-heading"
        icon="list"
      >
        {areas.length === 0 ? (
          <PageEmptyState
            description="Create an Area for this Building to use it in inspection plans and workflows."
            icon="list"
            title="No Areas yet"
          />
        ) : (
          <RecordList label="Areas">
            {areas.map((area) => (
              <RecordListItem
                href={`/setup/areas/${area.id}`}
                key={area.id}
                subtitle={`${area.areaTypeName} · ${areaStatus(area)}`}
                title={area.name}
              />
            ))}
          </RecordList>
        )}
      </SetupDetailSection>
    </SetupDetailPage>
  );
}
