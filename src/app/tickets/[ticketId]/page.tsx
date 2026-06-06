import Link from "next/link";
import { notFound } from "next/navigation";

import { CorrectionNoteForm } from "@/app/correction-notes/correction-note-form";
import { CorrectionNoteList } from "@/app/correction-notes/correction-note-list";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { listCorrectionNotes } from "@/lib/correction-notes/repository";
import { createEvidencePhotoUrl } from "@/lib/evidence/storage";
import { getTicket } from "@/lib/tickets/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

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
    <ul aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {photos.map((photo, index) => (
        <li className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50" key={photo.id}>
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
    <AppPage>
      <AppPageHero
        backHref="/tickets"
        backLabel="Tickets"
        badge={
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-400/25 bg-brand-emerald-500/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
            <Glyph className="size-3.5 text-brand-emerald-300" name="ticket" />
            {ticket.displayNumber} · {ticket.status === "closed" ? "Closed" : "Open"}
          </p>
        }
        description={`${ticket.clientName} · ${ticket.buildingName} · ${ticket.areaName}`}
        eyebrow="Ticket detail"
        title={ticket.title}
      />

      <AppPageBody overlap="detail">
        <PageSection heading="Failure proof" headingId="ticket-failure-heading" icon="document">
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Failed item: {ticket.failedItemName}</p>
            {ticket.failedItemDescription ? (
              <p className="text-sm text-muted-ink">{ticket.failedItemDescription}</p>
            ) : null}
            {ticket.issueNote ? (
              <p className="text-sm text-slate-700">Issue: {ticket.issueNote}</p>
            ) : null}
            <PhotoGrid label="Before Photos" photos={beforePhotos} />
          </div>
        </PageSection>

        {ticket.status === "open" ? (
          canCloseTicket ? (
            <Link className={ux.primaryButton} href={`/tickets/${ticket.id}/close`}>
              Close Ticket
            </Link>
          ) : null
        ) : (
          <>
            <PageSection heading="Closure proof" headingId="ticket-closure-heading" icon="check">
              <div className="space-y-3">
                {ticket.resolutionNote ? (
                  <p className="text-sm text-slate-700">Resolution: {ticket.resolutionNote}</p>
                ) : null}
                <p className="text-sm text-muted-ink">
                  Closed by {ticket.closedByEmail ?? "Unknown"} · {formatDateTime(ticket.closedAt)}
                </p>
                <PhotoGrid label="After Photos" photos={afterPhotos} />
              </div>
            </PageSection>

            <PageSection heading="Resolution report" headingId="ticket-report-heading" icon="download">
              <Link
                aria-describedby="ticket-resolution-report-download-help"
                className={`${ux.primaryButton} gap-2`}
                href={`/tickets/${ticket.id}/resolution-report`}
              >
                <Glyph className="size-4" name="download" />
                Download Ticket Resolution Report PDF
              </Link>
              <p className="mt-3 text-sm text-muted-ink" id="ticket-resolution-report-download-help">
                Opens a PDF download for this Closed Ticket. If the download fails, retry after
                refreshing or ask a Supervisor to check production logs.
              </p>
            </PageSection>
          </>
        )}

        <PageSection heading="Correction Notes" headingId="ticket-correction-notes-heading" icon="note">
          <div className="space-y-4">
            <CorrectionNoteList notes={notes} />
            {canAddCorrectionNote ? (
              <CorrectionNoteForm targetId={ticket.id} targetType="ticket" />
            ) : null}
          </div>
        </PageSection>
      </AppPageBody>
    </AppPage>
  );
}
