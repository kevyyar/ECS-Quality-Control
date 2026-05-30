import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listAreas,
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";

type SetupPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const search = params?.q?.trim() ?? "";
  const [clients, buildings, areas] = search
    ? await Promise.all([
        listClients({ visibility: "historical", search }),
        listBuildings({ visibility: "historical", search }),
        listAreas({ visibility: "historical", search }),
      ])
    : [[], [], []];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-3xl space-y-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Setup management
          </h1>
          <p className="text-muted-ink">
            Manage shared setup records for the Janitorial Company.
          </p>
        </div>

        <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2" htmlFor="setup-search">
            <span className="text-sm font-semibold text-slate-900">
              Search Clients, Buildings, and Areas by name
            </span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={search}
              id="setup-search"
              name="q"
              placeholder="Client, Building, or Area name"
              type="search"
            />
          </label>
          <button
            className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="submit"
          >
            Search
          </button>
          <Link className="py-3 text-sm font-semibold text-brand-700" href="/setup">
            Clear
          </Link>
        </form>

        {search ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 p-5" aria-labelledby="setup-search-results-heading">
            <h2 id="setup-search-results-heading" className="text-xl font-semibold text-slate-950">
              Setup search results
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-950">Clients</h3>
                {clients.length === 0 ? <p className="text-sm text-muted-ink">No Clients found.</p> : null}
                <ul className="space-y-2">
                  {clients.map((client) => (
                    <li key={client.id}>
                      <Link className="text-sm font-semibold text-brand-700" href={`/setup/clients/${client.id}`}>
                        {client.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-950">Buildings</h3>
                {buildings.length === 0 ? <p className="text-sm text-muted-ink">No Buildings found.</p> : null}
                <ul className="space-y-2">
                  {buildings.map((building) => (
                    <li key={building.id}>
                      <Link className="text-sm font-semibold text-brand-700" href={`/setup/buildings/${building.id}`}>
                        {building.name}
                      </Link>
                      <p className="text-xs text-muted-ink">{building.clientName}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-950">Areas</h3>
                {areas.length === 0 ? <p className="text-sm text-muted-ink">No Areas found.</p> : null}
                <ul className="space-y-2">
                  {areas.map((area) => (
                    <li key={area.id}>
                      <Link className="text-sm font-semibold text-brand-700" href={`/setup/areas/${area.id}`}>
                        {area.name}
                      </Link>
                      <p className="text-xs text-muted-ink">{area.clientName} · {area.buildingName}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-4">
          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/clients"
          >
            <span className="block text-lg font-semibold">Clients</span>
            <span className="mt-2 block text-sm">
              Create, edit, archive, and restore service customers.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/buildings"
          >
            <span className="block text-lg font-semibold">Buildings</span>
            <span className="mt-2 block text-sm">
              Manage service locations under active Clients.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/area-types"
          >
            <span className="block text-lg font-semibold">Area Types</span>
            <span className="mt-2 block text-sm">
              Manage reusable Area categories used to organize Areas.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/areas"
          >
            <span className="block text-lg font-semibold">Areas</span>
            <span className="mt-2 block text-sm">
              Manage inspectable spaces under active Buildings.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/inspection-templates"
          >
            <span className="block text-lg font-semibold">Inspection Templates</span>
            <span className="mt-2 block text-sm">
              Manage reusable inspection checklists and starter templates.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/setup/building-inspection-plans"
          >
            <span className="block text-lg font-semibold">Building Inspection Plans</span>
            <span className="mt-2 block text-sm">
              Assign active Areas and Inspection Templates used when starting future Draft Inspections.
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-brand-700 transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href="/company-branding"
          >
            <span className="block text-lg font-semibold">Company Branding</span>
            <span className="mt-2 block text-sm">
              Configure the shared identity used by the app and future PDF reports.
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
