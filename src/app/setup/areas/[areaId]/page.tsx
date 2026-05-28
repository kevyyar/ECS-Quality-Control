import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getArea } from "@/lib/client-building-setup/repository";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup/areas">
            ← Areas
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {statusLabel(area)}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {area.name}
            </h1>
            <p className="text-muted-ink">
              Client: {" "}
              <Link
                className="font-semibold text-brand-700"
                href={`/setup/clients/${area.clientId}`}
              >
                {area.clientName}
              </Link>
              {" · "}
              Building: {" "}
              <Link
                className="font-semibold text-brand-700"
                href={`/setup/buildings/${area.buildingId}`}
              >
                {area.buildingName}
              </Link>
              {" · "}
              Area Type: {" "}
              <Link
                className="font-semibold text-brand-700"
                href={`/setup/area-types/${area.areaTypeId}`}
              >
                {area.areaTypeName}
              </Link>
            </p>
          </div>
        </div>

        {inactiveMessage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {inactiveMessage}
          </p>
        ) : null}

        <AreaEditForm area={area} />

        <form action={area.isArchived ? restoreAreaAction : archiveAreaAction}>
          <input name="id" type="hidden" value={area.id} />
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="submit"
          >
            {area.isArchived ? "Restore Area" : "Archive Area"}
          </button>
        </form>
      </section>
    </main>
  );
}
