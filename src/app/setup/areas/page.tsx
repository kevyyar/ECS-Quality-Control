import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listAreas,
  listAreaTypes,
  listBuildings,
} from "@/lib/client-building-setup/repository";

import { AreaCreateForm } from "./area-form";

type AreasPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function statusLabel(area: Awaited<ReturnType<typeof listAreas>>[number]): string {
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

export default async function AreasPage({ searchParams }: AreasPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const [areas, activeBuildings, activeAreaTypes] = await Promise.all([
    listAreas({ visibility: includeArchived ? "historical" : "active" }),
    listBuildings({ visibility: "active" }),
    listAreaTypes({ visibility: "active" }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup">
            ← Setup
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Areas
            </h1>
            <p className="text-muted-ink">
              Manage inspectable spaces under active Buildings and Area Types.
              Archived parents hide Areas from active lookup lists.
            </p>
          </div>
        </div>

        <AreaCreateForm activeBuildings={activeBuildings} activeAreaTypes={activeAreaTypes} />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Areas" : "Active Areas"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={includeArchived ? "/setup/areas" : "/setup/areas?includeArchived=1"}
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {areas.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Areas found.
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
                        {area.clientName} · {area.buildingName} · {area.areaTypeName} · {statusLabel(area)}
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
