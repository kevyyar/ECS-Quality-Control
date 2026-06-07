import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { listOpenTickets } from "@/lib/tickets/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageEmptyState,
  PageSection,
  RecordList,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

type TicketsPageProps = {
  searchParams?: Promise<{
    clientId?: string;
    buildingId?: string;
    areaId?: string;
    q?: string;
  }>;
};

type FilterOption = {
  id: string;
  name: string;
};

function uniqueOptions(
  tickets: Awaited<ReturnType<typeof listOpenTickets>>,
  kind: "client" | "building" | "area",
): FilterOption[] {
  const options = new Map<string, string>();

  tickets.forEach((ticket) => {
    if (kind === "client") {
      options.set(ticket.clientId, ticket.clientName);
    } else if (kind === "building") {
      options.set(ticket.buildingId, ticket.buildingName);
    } else {
      options.set(ticket.areaId, ticket.areaName);
    }
  });

  return [...options.entries()].map(([id, name]) => ({ id, name }));
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: FilterOption[];
  value: string | undefined;
}) {
  return (
    <label className={ux.formField} htmlFor={`ticket-filter-${name}`}>
      <span className={ux.fieldLabel}>{label}</span>
      <select
        className={ux.select}
        defaultValue={value ?? ""}
        id={`ticket-filter-${name}`}
        name={name}
      >
        <option value="">All {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const user = await requireInternalUser();
  const canCloseTickets = canPerformProtectedAction(user.capabilities, "closeTicket");

  const params = await searchParams;
  const [allOpenTickets, openTickets] = await Promise.all([
    listOpenTickets(),
    listOpenTickets({
      clientId: params?.clientId,
      buildingId: params?.buildingId,
      areaId: params?.areaId,
      search: params?.q,
    }),
  ]);

  const hasActiveFilters = Boolean(
    params?.clientId || params?.buildingId || params?.areaId || params?.q,
  );

  return (
    <AppPage>
      <AppPageHero
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Review unresolved quality issues. Supervisors can close Tickets with resolution notes and After Photos."
        eyebrow="Corrective Actions"
        title="Open"
        titleAccent="Tickets"
      />

      <AppPageBody>
        <PageSection heading="Filters" headingId="ticket-filters-heading" icon="filter">
          <form className="grid gap-4 lg:grid-cols-5">
            <label className={`${ux.formField} lg:col-span-2`} htmlFor="ticket-search">
              <span className={ux.fieldLabel}>Search</span>
              <input
                className={ux.input}
                defaultValue={params?.q ?? ""}
                id="ticket-search"
                name="q"
                placeholder="T-000001 or restroom mirror"
                type="search"
              />
            </label>
            <FilterSelect
              label="Clients"
              name="clientId"
              options={uniqueOptions(allOpenTickets, "client")}
              value={params?.clientId}
            />
            <FilterSelect
              label="Buildings"
              name="buildingId"
              options={uniqueOptions(allOpenTickets, "building")}
              value={params?.buildingId}
            />
            <FilterSelect
              label="Areas"
              name="areaId"
              options={uniqueOptions(allOpenTickets, "area")}
              value={params?.areaId}
            />
            <div className={`${ux.searchActions} lg:col-span-5`}>
              <button className={ux.primaryButton} type="submit">
                Apply filters
              </button>
              <Link className={ux.textLink} href="/tickets">
                Clear
              </Link>
            </div>
          </form>
        </PageSection>

        <PageSection
          headerAside={
            <p className="text-xs text-muted-ink">
              {openTickets.length} {openTickets.length === 1 ? "result" : "results"}
            </p>
          }
          heading="Open Tickets"
          headingId="ticket-results-heading"
          icon="ticket"
        >
          {openTickets.length === 0 ? (
            <PageEmptyState
              action={
                hasActiveFilters ? (
                  <Link className={ux.secondaryButton} href="/tickets">
                    Clear filters
                  </Link>
                ) : undefined
              }
              description={
                hasActiveFilters
                  ? "Try adjusting your filters or clearing them to see more results."
                  : "Tickets are created automatically when inspection items fail."
              }
              icon="ticket"
              title="No Open Tickets found"
            />
          ) : (
            <RecordList label="Open Tickets">
              {openTickets.map((ticket) => (
                <li key={ticket.id}>
                  <article className={ux.recordCard}>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-forest-700">
                          {ticket.displayNumber}
                        </p>
                      </div>
                      <h2 className="font-display text-base font-bold text-slate-950">
                        {ticket.title}
                      </h2>
                      <p className="text-sm text-muted-ink">
                        {ticket.clientName} · {ticket.buildingName} · {ticket.areaName}
                      </p>
                      <p className="text-sm text-slate-700">
                        Failed item: {ticket.failedItemName}
                      </p>
                      {ticket.issueNote ? (
                        <p className="text-sm text-slate-700">Issue: {ticket.issueNote}</p>
                      ) : null}
                      <p className="text-xs text-muted-ink">
                        Created {formatDateTime(ticket.createdAt)} · Before Photos:{" "}
                        {ticket.beforePhotos.length}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <Link className={ux.secondaryButton} href={`/tickets/${ticket.id}`}>
                        View / Add Notes
                      </Link>
                      {canCloseTickets ? (
                        <Link className={ux.primaryButton} href={`/tickets/${ticket.id}/close`}>
                          Close Ticket
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </RecordList>
          )}
        </PageSection>

        <footer className="pt-2 text-center text-xs text-muted-ink">
          <Glyph className="mr-1 inline size-3 text-brand-forest-600" name="ticket" />
          Open Tickets stay visible until a Supervisor closes them with proof.
        </footer>
      </AppPageBody>
    </AppPage>
  );
}
