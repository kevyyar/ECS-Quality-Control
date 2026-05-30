import Link from "next/link";

import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { listOpenTickets } from "@/lib/tickets/repository";

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
    <label className="space-y-2" htmlFor={`ticket-filter-${name}`}>
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-5xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/">
            ← Home
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Tickets
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Open Tickets
            </h1>
            <p className="text-muted-ink">
              Review unresolved quality issues. Supervisors can close Tickets with
              resolution notes and After Photos.
            </p>
          </div>
        </div>

        <form className="grid gap-4 rounded-2xl border border-slate-200 p-5 md:grid-cols-5">
          <label className="space-y-2 md:col-span-2" htmlFor="ticket-search">
            <span className="text-sm font-semibold text-slate-900">Search Tickets</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
          <div className="flex flex-wrap items-end gap-3 md:col-span-5">
            <button
              className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type="submit"
            >
              Apply filters
            </button>
            <Link className="py-3 text-sm font-semibold text-brand-700" href="/tickets">
              Clear
            </Link>
          </div>
        </form>

        {openTickets.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
            No Open Tickets found.
          </p>
        ) : (
          <ul className="space-y-4" aria-label="Open Tickets">
            {openTickets.map((ticket) => (
              <li key={ticket.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-brand-700">
                      {ticket.displayNumber}
                    </p>
                    <h2 className="text-xl font-semibold text-slate-950">
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
                      Created {formatDateTime(ticket.createdAt)} · Before Photos: {ticket.beforePhotos.length}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      className="rounded-xl border border-brand-700 px-4 py-2 text-center text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      href={`/tickets/${ticket.id}`}
                    >
                      View / Add Notes
                    </Link>
                    {canCloseTickets ? (
                      <Link
                        className="rounded-xl bg-brand-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        href={`/tickets/${ticket.id}/close`}
                      >
                        Close Ticket
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
