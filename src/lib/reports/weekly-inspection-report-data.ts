import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import {
  correctionNotes,
  inspectionAreaInspections,
  inspectionItemEvidence,
  inspectionItems,
  inspections,
  ticketAfterPhotoEvidence,
  tickets,
} from "@/db/schema";
import { getCompanyBranding } from "@/lib/company-branding/repository";
import { formatTicketNumber } from "@/lib/tickets/model";

import {
  buildWeeklyInspectionReportData,
  type ReportCorrectionNote,
  type ReportPhoto,
  type WeeklyInspectionReportData,
  type WeeklyInspectionReportInput,
} from "./weekly-inspection-report";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AreaRow = typeof inspectionAreaInspections.$inferSelect;
type ItemRow = typeof inspectionItems.$inferSelect;
type TicketRow = typeof tickets.$inferSelect;
type CorrectionNoteRow = typeof correctionNotes.$inferSelect;

function isRecordId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function noteTargetId(row: CorrectionNoteRow): string {
  return row.targetType === "ticket" ? row.ticketId ?? "" : row.inspectionId ?? "";
}

function toReportCorrectionNote(row: CorrectionNoteRow): ReportCorrectionNote {
  return {
    id: row.id,
    targetType: row.targetType as "submitted_inspection" | "ticket",
    targetId: noteTargetId(row),
    note: row.note,
    createdByEmail: row.createdByEmail,
    createdAt: row.createdAt,
  };
}

function photosByParent<T extends { id: string; storagePath: string }>(
  rows: Array<T & { parentId: string }>,
): Map<string, ReportPhoto[]> {
  const grouped = new Map<string, ReportPhoto[]>();

  rows.forEach((row) => {
    const photos = grouped.get(row.parentId) ?? [];
    photos.push({ id: row.id, storagePath: row.storagePath });
    grouped.set(row.parentId, photos);
  });

  return grouped;
}

function correctionNotePredicate(inspectionId: string, ticketIds: string[]) {
  if (ticketIds.length === 0) {
    return eq(correctionNotes.inspectionId, inspectionId);
  }

  return or(
    eq(correctionNotes.inspectionId, inspectionId),
    inArray(correctionNotes.ticketId, ticketIds),
  );
}

export async function getWeeklyInspectionReportData(
  inspectionId: string,
): Promise<WeeklyInspectionReportData | null> {
  if (!isRecordId(inspectionId)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const branding = await getCompanyBranding();
  const [inspection] = await db
    .select()
    .from(inspections)
    .where(eq(inspections.id, inspectionId))
    .limit(1);

  if (!inspection || inspection.status !== "submitted") {
    return null;
  }

  const areaRows: AreaRow[] = await db
    .select()
    .from(inspectionAreaInspections)
    .where(eq(inspectionAreaInspections.inspectionId, inspection.id))
    .orderBy(asc(inspectionAreaInspections.position));
  const areaIds = areaRows.map((area) => area.id);
  const itemRows: ItemRow[] = areaIds.length
    ? await db
        .select()
        .from(inspectionItems)
        .where(inArray(inspectionItems.areaInspectionId, areaIds))
        .orderBy(asc(inspectionItems.position))
    : [];
  const itemIds = itemRows.map((item) => item.id);
  const ticketRows: TicketRow[] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.inspectionId, inspection.id))
    .orderBy(asc(tickets.ticketNumber));
  const ticketIds = ticketRows.map((ticket) => ticket.id);
  const beforePhotoRows = itemIds.length
    ? await db
        .select({
          id: inspectionItemEvidence.id,
          parentId: inspectionItemEvidence.inspectionItemId,
          storagePath: inspectionItemEvidence.storagePath,
        })
        .from(inspectionItemEvidence)
        .where(
          and(
            inArray(inspectionItemEvidence.inspectionItemId, itemIds),
            eq(inspectionItemEvidence.evidenceType, "before_photo"),
          ),
        )
        .orderBy(asc(inspectionItemEvidence.uploadedAt), asc(inspectionItemEvidence.id))
    : [];
  const afterPhotoRows = ticketIds.length
    ? await db
        .select({
          id: ticketAfterPhotoEvidence.id,
          parentId: ticketAfterPhotoEvidence.ticketId,
          storagePath: ticketAfterPhotoEvidence.storagePath,
        })
        .from(ticketAfterPhotoEvidence)
        .where(inArray(ticketAfterPhotoEvidence.ticketId, ticketIds))
        .orderBy(asc(ticketAfterPhotoEvidence.uploadedAt), asc(ticketAfterPhotoEvidence.id))
    : [];
  const noteRows: CorrectionNoteRow[] = await db
    .select()
    .from(correctionNotes)
    .where(correctionNotePredicate(inspection.id, ticketIds))
    .orderBy(asc(correctionNotes.createdAt), asc(correctionNotes.id));
  const beforePhotosByItemId = photosByParent(beforePhotoRows);
  const afterPhotosByTicketId = photosByParent(afterPhotoRows);
  const input: WeeklyInspectionReportInput = {
    branding,
    inspection: {
      id: inspection.id,
      status: inspection.status,
      clientName: inspection.clientNameSnapshot,
      buildingName: inspection.buildingNameSnapshot,
      submittedAt: inspection.submittedAt,
      submittedByEmail: inspection.submittedByEmail,
    },
    areaInspections: areaRows.map((area) => ({
      id: area.id,
      source: area.source as "planned" | "one_off",
      position: area.position,
      areaName: area.areaNameSnapshot,
      templateName: area.inspectionTemplateNameSnapshot,
      isSkipped: area.isSkipped,
      skipReason: area.skipReason,
    })),
    items: itemRows.map((item) => ({
      id: item.id,
      areaInspectionId: item.areaInspectionId,
      position: item.position,
      sectionName: item.sectionNameSnapshot,
      name: item.itemNameSnapshot,
      description: item.itemDescriptionSnapshot,
      resultStatus: item.resultStatus as "pass" | "fail" | "not_applicable" | null,
      resultNote: item.resultNote,
      beforePhotos: beforePhotosByItemId.get(item.id) ?? [],
    })),
    tickets: ticketRows.map((ticket) => ({
      id: ticket.id,
      inspectionItemId: ticket.inspectionItemId,
      displayNumber: formatTicketNumber(ticket.ticketNumber),
      title: ticket.title,
      status: ticket.status as "open" | "closed",
      resolutionNote: ticket.resolutionNote,
      closedByEmail: ticket.closedByEmail,
      closedAt: ticket.closedAt,
      afterPhotos: afterPhotosByTicketId.get(ticket.id) ?? [],
    })),
    correctionNotes: noteRows.map(toReportCorrectionNote),
  };

  return buildWeeklyInspectionReportData(input);
}
