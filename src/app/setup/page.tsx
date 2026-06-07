import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listAreas,
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
  SetupNavCard,
} from "@/lib/ux/app-page";
import { setupNavItems } from "@/lib/ux/setup-nav-items";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

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
    <AppPage>
      <AppPageHero
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Manage shared setup records for the Janitorial Company."
        eyebrow="Configuration"
        title="Setup"
        titleAccent="management"
      />

      <AppPageBody>
        <PageSection heading="Search setup records" headingId="setup-search-heading" icon="search">
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5" htmlFor="setup-search">
              <span className={ux.fieldLabel}>Name</span>
              <input
                className={ux.input}
                defaultValue={search}
                id="setup-search"
                name="q"
                placeholder="Client, Building, or Area name"
                type="search"
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <button className={ux.primaryButton} type="submit">
                Search
              </button>
              <Link className={`${ux.textLink} py-2.5`} href="/setup">
                Clear
              </Link>
            </div>
          </form>
        </PageSection>

        {search ? (
          <PageSection
            heading="Search results"
            headingId="setup-search-results-heading"
            icon="list"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">Clients</h3>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-ink">No Clients found.</p>
                ) : (
                  <ul className="space-y-2">
                    {clients.map((client) => (
                      <li key={client.id}>
                        <Link className={ux.textLink} href={`/setup/clients/${client.id}`}>
                          {client.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">Buildings</h3>
                {buildings.length === 0 ? (
                  <p className="text-sm text-muted-ink">No Buildings found.</p>
                ) : (
                  <ul className="space-y-2">
                    {buildings.map((building) => (
                      <li key={building.id}>
                        <Link className={ux.textLink} href={`/setup/buildings/${building.id}`}>
                          {building.name}
                        </Link>
                        <p className="text-xs text-muted-ink">{building.clientName}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">Areas</h3>
                {areas.length === 0 ? (
                  <p className="text-sm text-muted-ink">No Areas found.</p>
                ) : (
                  <ul className="space-y-2">
                    {areas.map((area) => (
                      <li key={area.id}>
                        <Link className={ux.textLink} href={`/setup/areas/${area.id}`}>
                          {area.name}
                        </Link>
                        <p className="text-xs text-muted-ink">
                          {area.clientName} · {area.buildingName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </PageSection>
        ) : null}

        <PageSection heading="Setup areas" headingId="setup-areas-heading" icon="settings">
          <div className="grid gap-4">
            {setupNavItems.map((item) => (
              <SetupNavCard
                description={item.description}
                href={item.href}
                key={item.href}
                title={item.title}
              />
            ))}
          </div>
        </PageSection>

        <footer className="pt-2 text-center text-xs text-muted-ink">
          <Glyph className="mr-1 inline size-3 text-brand-forest-600" name="settings" />
          Setup records stay available for historical inspections and reports when archived.
        </footer>
      </AppPageBody>
    </AppPage>
  );
}
