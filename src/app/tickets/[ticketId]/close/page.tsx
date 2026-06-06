import { notFound } from "next/navigation";

import { CorrectionNoteForm } from "@/app/correction-notes/correction-note-form";
import { CorrectionNoteList } from "@/app/correction-notes/correction-note-list";
import { requireProtectedAction } from "@/lib/auth/session";
import { listCorrectionNotes } from "@/lib/correction-notes/repository";
import { createEvidencePhotoUrl } from "@/lib/evidence/storage";
import { getOpenTicket } from "@/lib/tickets/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";

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
    <AppPage>
      <AppPageHero
        backHref={`/tickets/${ticket.id}`}
        backLabel="Ticket detail"
        description={`${ticket.clientName} · ${ticket.buildingName} · ${ticket.areaName}`}
        eyebrow={ticket.displayNumber}
        title="Close"
        titleAccent={ticket.title}
      />

      <AppPageBody overlap="detail">
        <PageSection heading="Original failure proof" headingId="ticket-proof-heading" icon="document">
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Failed item: {ticket.failedItemName}</p>
            {ticket.failedItemDescription ? (
              <p className="text-sm text-muted-ink">{ticket.failedItemDescription}</p>
            ) : null}
            {ticket.issueNote ? (
              <p className="text-sm text-slate-700">Issue: {ticket.issueNote}</p>
            ) : null}

            {photos.length === 0 ? (
              <p className="text-sm text-muted-ink">No Before Photos available.</p>
            ) : (
              <ul aria-label="Before Photos" className="grid gap-3 sm:grid-cols-2">
                {photos.map((photo, index) => (
                  <li className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50" key={photo.id}>
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
          </div>
        </PageSection>

        <PageSection heading="Correction Notes" headingId="ticket-correction-notes-heading" icon="note">
          <div className="space-y-4">
            <CorrectionNoteList notes={notes} />
            <CorrectionNoteForm targetId={ticket.id} targetType="ticket" />
          </div>
        </PageSection>

        <PageSection heading="Close ticket" headingId="ticket-close-form-heading" icon="check">
          <TicketClosureForm ticketId={ticket.id} />
        </PageSection>
      </AppPageBody>
    </AppPage>
  );
}
