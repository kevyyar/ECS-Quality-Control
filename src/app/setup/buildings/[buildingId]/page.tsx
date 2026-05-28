import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getBuilding } from "@/lib/client-building-setup/repository";

import { archiveBuildingAction, restoreBuildingAction } from "../actions";
import { BuildingEditForm } from "../building-form";

type BuildingDetailPageProps = {
  params: Promise<{ buildingId: string }>;
};

function statusLabel(building: NonNullable<Awaited<ReturnType<typeof getBuilding>>>): string {
  if (building.isArchived) {
    return "Archived";
  }

  if (building.isParentArchived) {
    return "Restored but inactive while parent Client is archived";
  }

  return "Active";
}

export default async function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { buildingId } = await params;
  const building = await getBuilding(buildingId);

  if (!building) {
    notFound();
  }

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
      </section>
    </main>
  );
}
