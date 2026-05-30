import Link from "next/link";
import { notFound } from "next/navigation";

import { CorrectionNoteForm } from "@/app/correction-notes/correction-note-form";
import { CorrectionNoteList } from "@/app/correction-notes/correction-note-list";
import { requireProtectedAction } from "@/lib/auth/session";
import { listCorrectionNotes } from "@/lib/correction-notes/repository";
import { createEvidencePhotoUrl } from "@/lib/evidence/storage";
import { getOpenTicket } from "@/lib/tickets/repository";

import { TicketClosureForm } from "../../ticket-closure-form";

type CloseTicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

async function beforePhotoUrls(
  photos: NonNullable<Awaited<ReturnType<typeof getOpenTicket>>>["beforePhotos"],
): Promise<Array<{ id: string; url: string | null }>> {
  return Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      url: await createEvidencePhotoUrl(photo.storagePath),
    })),
  );
}

export default async function CloseTicketPage({ params }: CloseTicketPageProps) {
  await requireProtectedAction("closeTicket");

  const { ticketId } = await params;
  const ticket = await getOpenTicket(ticketId);

  if (!ticket) {
    notFound();
  }

  const [photos, notes] = await Promise.all([
    beforePhotoUrls(ticket.beforePhotos),
    listCorrectionNotes({ targetType: "ticket", targetId: ticket.id }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/tickets">
            ← Open Tickets
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {ticket.displayNumber}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Close {ticket.title}
            </h1>
            <p className="text-muted-ink">
              {ticket.clientName} · {ticket.buildingName} · {ticket.areaName}
            </p>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-slate-200 p-5" aria-labelledby="ticket-proof-heading">
          <h2 id="ticket-proof-heading" className="text-xl font-semibold text-slate-950">
            Original failure proof
          </h2>
          <p className="text-sm text-slate-700">
            Failed item: {ticket.failedItemName}
          </p>
          {ticket.failedItemDescription ? (
            <p className="text-sm text-muted-ink">{ticket.failedItemDescription}</p>
          ) : null}
          {ticket.issueNote ? (
            <p className="text-sm text-slate-700">Issue: {ticket.issueNote}</p>
          ) : null}

          {photos.length === 0 ? (
            <p className="text-sm text-muted-ink">No Before Photos available.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Before Photos">
              {photos.map((photo, index) => (
                <li key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Before Photo ${index + 1}`}
                      className="h-48 w-full object-cover"
                      src={photo.url}
                    />
                  ) : (
                    <p className="p-4 text-sm text-muted-ink">Before Photo unavailable.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4" aria-labelledby="ticket-correction-notes-heading">
          <h2 id="ticket-correction-notes-heading" className="text-xl font-semibold text-slate-950">
            Correction Notes
          </h2>
          <CorrectionNoteList notes={notes} />
          <CorrectionNoteForm targetId={ticket.id} targetType="ticket" />
        </section>

        <TicketClosureForm ticketId={ticket.id} />
      </section>
    </main>
  );
}
