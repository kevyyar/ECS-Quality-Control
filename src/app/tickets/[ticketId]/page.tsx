import Link from "next/link";
import { notFound } from "next/navigation";

import { CorrectionNoteForm } from "@/app/correction-notes/correction-note-form";
import { CorrectionNoteList } from "@/app/correction-notes/correction-note-list";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { listCorrectionNotes } from "@/lib/correction-notes/repository";
import { createEvidencePhotoUrl } from "@/lib/evidence/storage";
import { getTicket } from "@/lib/tickets/repository";

type TicketDetailPageProps = {
  params: Promise<{ ticketId: string }>;
};

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function photoUrls(
  photos: { id: string; storagePath: string }[],
): Promise<Array<{ id: string; url: string | null }>> {
  return Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      url: await createEvidencePhotoUrl(photo.storagePath),
    })),
  );
}

function PhotoGrid({
  label,
  photos,
}: {
  label: string;
  photos: Array<{ id: string; url: string | null }>;
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-ink">No {label} available.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-label={label}>
      {photos.map((photo, index) => (
        <li key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {photo.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${label} ${index + 1}`}
              className="h-48 w-full object-cover"
              src={photo.url}
            />
          ) : (
            <p className="p-4 text-sm text-muted-ink">Photo unavailable.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const user = await requireInternalUser();

  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);

  if (!ticket) {
    notFound();
  }

  const canAddCorrectionNote = canPerformProtectedAction(
    user.capabilities,
    "addCorrectionNote",
  );
  const canCloseTicket = canPerformProtectedAction(user.capabilities, "closeTicket");
  const [notes, beforePhotos, afterPhotos] = await Promise.all([
    listCorrectionNotes({ targetType: "ticket", targetId: ticket.id }),
    photoUrls(ticket.beforePhotos),
    photoUrls(ticket.afterPhotos),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/tickets">
            ← Tickets
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {ticket.displayNumber} · {ticket.status === "closed" ? "Closed" : "Open"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {ticket.title}
            </h1>
            <p className="text-muted-ink">
              {ticket.clientName} · {ticket.buildingName} · {ticket.areaName}
            </p>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-slate-200 p-5" aria-labelledby="ticket-failure-heading">
          <h2 id="ticket-failure-heading" className="text-xl font-semibold text-slate-950">
            Failure proof
          </h2>
          <p className="text-sm text-slate-700">Failed item: {ticket.failedItemName}</p>
          {ticket.failedItemDescription ? (
            <p className="text-sm text-muted-ink">{ticket.failedItemDescription}</p>
          ) : null}
          {ticket.issueNote ? (
            <p className="text-sm text-slate-700">Issue: {ticket.issueNote}</p>
          ) : null}
          <PhotoGrid label="Before Photos" photos={beforePhotos} />
        </section>

        {ticket.status === "open" ? (
          canCloseTicket ? (
            <Link
              className="inline-flex rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              href={`/tickets/${ticket.id}/close`}
            >
              Close Ticket
            </Link>
          ) : null
        ) : (
          <>
            <div className="space-y-2">
              <Link
                aria-describedby="ticket-resolution-report-download-help"
                className="inline-flex rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                href={`/tickets/${ticket.id}/resolution-report`}
              >
                Download Ticket Resolution Report PDF
              </Link>
              <p id="ticket-resolution-report-download-help" className="text-sm text-muted-ink">
                Opens a PDF download for this Closed Ticket. If the download fails,
                retry after refreshing or ask a Supervisor to check production logs.
              </p>
            </div>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-5" aria-labelledby="ticket-closure-heading">
              <h2 id="ticket-closure-heading" className="text-xl font-semibold text-slate-950">
                Closure proof
              </h2>
              {ticket.resolutionNote ? (
                <p className="text-sm text-slate-700">Resolution: {ticket.resolutionNote}</p>
              ) : null}
              <p className="text-sm text-muted-ink">
                Closed by {ticket.closedByEmail ?? "Unknown"} · {formatDateTime(ticket.closedAt)}
              </p>
              <PhotoGrid label="After Photos" photos={afterPhotos} />
            </section>
          </>
        )}

        <section className="space-y-4" aria-labelledby="ticket-correction-notes-heading">
          <h2 id="ticket-correction-notes-heading" className="text-xl font-semibold text-slate-950">
            Correction Notes
          </h2>
          <CorrectionNoteList notes={notes} />
          {canAddCorrectionNote ? (
            <CorrectionNoteForm targetId={ticket.id} targetType="ticket" />
          ) : null}
        </section>
      </section>
    </main>
  );
}
