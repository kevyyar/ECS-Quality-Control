import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getAreaType,
  listAreas,
} from "@/lib/client-building-setup/repository";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup/area-types">
            ← Area Types
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {areaType.isArchived ? "Archived Area Type" : "Active Area Type"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {areaType.name}
            </h1>
          </div>
        </div>

        <AreaTypeEditForm areaType={areaType} />

        <form action={areaType.isArchived ? restoreAreaTypeAction : archiveAreaTypeAction}>
          <input name="id" type="hidden" value={areaType.id} />
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="submit"
          >
            {areaType.isArchived ? "Restore Area Type" : "Archive Area Type"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Areas</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/setup/areas">
              Manage Areas
            </Link>
          </div>

          {areas.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Areas use this Area Type.
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
                        {area.clientName} · {area.buildingName} · {areaStatus(area)}
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
