import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getArea } from "@/lib/client-building-setup/repository";
import {
  SetupDetailPage,
  SetupDetailSection,
} from "@/lib/ux/setup-detail-page";
import { ux } from "@/lib/ux/tokens";

import { archiveAreaAction, restoreAreaAction } from "../actions";
import { AreaEditForm } from "../area-form";

type AreaDetailPageProps = {
  params: Promise<{ areaId: string }>;
};

function statusLabel(area: NonNullable<Awaited<ReturnType<typeof getArea>>>): string {
  if (area.isArchived) {
    return "Archived";
  }

  if (area.isClientArchived) {
    return "Restored but inactive while parent Client is archived";
  }

  if (area.isBuildingArchived) {
    return "Restored but inactive while parent Building is archived";
  }

  if (area.isAreaTypeArchived) {
    return "Restored but inactive while Area Type is archived";
  }

  return "Active";
}

function inactiveParentMessage(
  area: NonNullable<Awaited<ReturnType<typeof getArea>>>,
): string | null {
  if (area.isArchived) {
    return null;
  }

  if (area.isClientArchived) {
    return "This Area is restored, but it remains inactive for new workflows until its parent Client is restored.";
  }

  if (area.isBuildingArchived) {
    return "This Area is restored, but it remains inactive for new workflows until its parent Building is restored.";
  }

  if (area.isAreaTypeArchived) {
    return "This Area is restored, but it remains inactive for new workflows until its Area Type is restored.";
  }

  return null;
}

export default async function AreaDetailPage({ params }: AreaDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { areaId } = await params;
  const area = await getArea(areaId);

  if (!area) {
    notFound();
  }

  const inactiveMessage = inactiveParentMessage(area);

  return (
    <SetupDetailPage
      backHref="/setup/areas"
      backLabel="Areas"
      description={
        <>
          Client:{" "}
          <Link className="font-semibold text-brand-emerald-300" href={`/setup/clients/${area.clientId}`}>
            {area.clientName}
          </Link>
          {" · "}
          Building:{" "}
          <Link className="font-semibold text-brand-emerald-300" href={`/setup/buildings/${area.buildingId}`}>
            {area.buildingName}
          </Link>
          {" · "}
          Area Type:{" "}
          <Link className="font-semibold text-brand-emerald-300" href={`/setup/area-types/${area.areaTypeId}`}>
            {area.areaTypeName}
          </Link>
        </>
      }
      eyebrow={statusLabel(area)}
      title={area.name}
    >
      {inactiveMessage ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {inactiveMessage}
        </p>
      ) : null}

      <SetupDetailSection heading="Edit Area" headingId="area-edit-heading" icon="settings">
        <AreaEditForm area={area} />
      </SetupDetailSection>

      <SetupDetailSection heading="Archive status" headingId="area-archive-heading" icon="shield">
        <form action={area.isArchived ? restoreAreaAction : archiveAreaAction}>
          <input name="id" type="hidden" value={area.id} />
          <button className={ux.mutedButton} type="submit">
            {area.isArchived ? "Restore Area" : "Archive Area"}
          </button>
        </form>
      </SetupDetailSection>
    </SetupDetailPage>
  );
}
