import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getAreaType,
  listAreas,
} from "@/lib/client-building-setup/repository";
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

import { archiveAreaTypeAction, restoreAreaTypeAction } from "../actions";
import { AreaTypeEditForm } from "../area-type-form";

type AreaTypeDetailPageProps = {
  params: Promise<{ areaTypeId: string }>;
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

export default async function AreaTypeDetailPage({ params }: AreaTypeDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { areaTypeId } = await params;
  const areaType = await getAreaType(areaTypeId);

  if (!areaType) {
    notFound();
  }

  const areas = await listAreas({
    visibility: "historical",
    areaTypeId: areaType.id,
  });

  return (
    <SetupDetailPage
      backHref="/setup/area-types"
      backLabel="Area Types"
      eyebrow={areaType.isArchived ? "Archived Area Type" : "Active Area Type"}
      title={areaType.name}
    >
      <SetupDetailSection heading="Edit Area Type" headingId="area-type-edit-heading" icon="settings">
        <AreaTypeEditForm areaType={areaType} />
      </SetupDetailSection>

      <SetupDetailSection heading="Archive status" headingId="area-type-archive-heading" icon="shield">
        <form action={areaType.isArchived ? restoreAreaTypeAction : archiveAreaTypeAction}>
          <input name="id" type="hidden" value={areaType.id} />
          <button className={ux.mutedButton} type="submit">
            {areaType.isArchived ? "Restore Area Type" : "Archive Area Type"}
          </button>
        </form>
      </SetupDetailSection>

      <SetupDetailSection
        headerAside={
          <Link className={ux.textLink} href="/setup/areas">
            Manage Areas
          </Link>
        }
        heading="Areas"
        headingId="area-type-areas-heading"
        icon="list"
      >
        {areas.length === 0 ? (
          <PageEmptyState
            description="Areas using this type will appear here once they are created."
            icon="list"
            title="No Areas use this type"
          />
        ) : (
          <RecordList label="Areas">
            {areas.map((area) => (
              <RecordListItem
                href={`/setup/areas/${area.id}`}
                key={area.id}
                meta={area.clientName}
                subtitle={`${area.buildingName} · ${areaStatus(area)}`}
                title={area.name}
              />
            ))}
          </RecordList>
        )}
      </SetupDetailSection>
    </SetupDetailPage>
  );
}
