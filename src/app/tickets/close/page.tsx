import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";

export default async function CloseTicketIndexPage() {
  await requireProtectedAction("closeTicket");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-3xl space-y-4 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Close Ticket
        </h1>
        <p className="text-muted-ink">
          Choose an Open Ticket from the Ticket list before closing it.
        </p>
        <Link className="text-sm font-semibold text-brand-700" href="/tickets">
          View Open Tickets
        </Link>
      </section>
    </main>
  );
}
