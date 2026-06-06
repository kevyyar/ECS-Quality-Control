import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listClients } from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";
import { ux } from "@/lib/ux/tokens";

import { ClientCreateForm } from "./client-form";

type ClientsPageProps = {
  searchParams?: Promise<{ includeArchived?: string; q?: string }>;
};

function statusLabel(isArchived: boolean): string {
  return isArchived ? "Archived" : "Active";
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const clients = await listClients({
    visibility: includeArchived ? "historical" : "active",
    search: params?.q,
  });

  return (
    <SetupListPage
      createForm={<ClientCreateForm />}
      description="Manage service customers. Archive Clients instead of deleting them so historical inspection context remains intact."
      emptyDescription="Create a Client or adjust your search to see more results."
      emptyTitle="No Clients found"
      listHeading={includeArchived ? "All Clients" : "Active Clients"}
      listHeadingId="clients-list-heading"
      records={clients.map((client) => ({
        id: client.id,
        href: `/setup/clients/${client.id}`,
        title: client.name,
        subtitle: statusLabel(client.isArchived),
      }))}
      searchForm={
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5" htmlFor="client-search">
            <span className={ux.fieldLabel}>Client name</span>
            <input
              className={ux.input}
              defaultValue={params?.q ?? ""}
              id="client-search"
              name="q"
              type="search"
            />
          </label>
          {includeArchived ? <input name="includeArchived" type="hidden" value="1" /> : null}
          <div className="flex flex-wrap items-end gap-3">
            <button className={ux.primaryButton} type="submit">
              Search
            </button>
            <Link
              className={`${ux.textLink} py-2.5`}
              href={includeArchived ? "/setup/clients?includeArchived=1" : "/setup/clients"}
            >
              Clear
            </Link>
          </div>
        </form>
      }
      title="Clients"
      toggleHref={includeArchived ? "/setup/clients" : "/setup/clients?includeArchived=1"}
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
