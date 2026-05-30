import "server-only";

import { and, asc, desc, eq, or, sql, type SQL } from "drizzle-orm";

import {
  buildings,
  clients,
  inspectionAreaInspections,
  inspectionItemEvidence,
  inspectionItems,
  inspections,
  ticketAfterPhotoEvidence,
  tickets,
} from "@/db/schema";

import { formatTicketNumber, parseTicketSearch, validateCloseTicketProof } from "./model";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TicketRow = typeof tickets.$inferSelect;

type OpenTicketHydrationRow = {
  ticket: TicketRow;
  client: { name: string };
  building: { name: string };
  inspection: {
    clientNameSnapshot: string;
    buildingNameSnapshot: string;
    submittedAt: Date | null;
    submittedByEmail: string | null;
  };
  areaInspection: { areaNameSnapshot: string };
  item: {
    itemNameSnapshot: string;
    itemDescriptionSnapshot: string | null;
    resultNote: string | null;
  };
  evidence: { id: string; storagePath: string } | null;
};

export type TicketEvidencePhoto = {
  id: string;
  storagePath: string;
};

export type OpenTicketSummary = {
  id: string;
  ticketNumber: number;
  displayNumber: string;
  title: string;
  clientId: string;
  buildingId: string;
  areaId: string;
  clientName: string;
  buildingName: string;
  areaName: string;
  inspectionSubmittedAt: Date | null;
  submittedByEmail: string | null;
  failedItemName: string;
  failedItemDescription: string | null;
  issueNote: string | null;
  beforePhotos: TicketEvidencePhoto[];
  createdAt: Date;
};


export type TicketDetail = OpenTicketSummary & {
  status: "open" | "closed";
  resolutionNote: string | null;
  closedByEmail: string | null;
  closedAt: Date | null;
  afterPhotos: TicketEvidencePhoto[];
};

export type ListOpenTicketFilters = {
  clientId?: string | undefined;
  buildingId?: string | undefined;
  areaId?: string | undefined;
  search?: string | undefined;
};

type OpenTicketQueryFilters = ListOpenTicketFilters & {
  ticketId?: string | undefined;
};

export type CloseTicketInput = {
  ticketId: string;
  resolutionNote: string;
  afterPhotoStoragePaths: string[];
};

export type TicketCloser = {
  authUserId: string;
  email: string;
};

export class TicketNotFoundError extends Error {
  constructor() {
    super("Ticket was not found.");
    this.name = "TicketNotFoundError";
  }
}

export class TicketAlreadyClosedError extends Error {
  constructor() {
    super("Ticket is already Closed.");
    this.name = "TicketAlreadyClosedError";
  }
}

export class TicketClosureValidationError extends Error {
  readonly fields: Partial<Record<"ticketId" | "resolutionNote" | "afterPhotos", string>>;

  constructor(fields: Partial<Record<"ticketId" | "resolutionNote" | "afterPhotos", string>>) {
    super("Ticket closure proof is incomplete.");
    this.name = "TicketClosureValidationError";
    this.fields = fields;
  }
}

export function isTicketNotFoundError(error: unknown): error is TicketNotFoundError {
  return error instanceof TicketNotFoundError;
}

export function isTicketAlreadyClosedError(
  error: unknown,
): error is TicketAlreadyClosedError {
  return error instanceof TicketAlreadyClosedError;
}

export function isTicketClosureValidationError(
  error: unknown,
): error is TicketClosureValidationError {
  return error instanceof TicketClosureValidationError;
}

function isRecordId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function literalLikePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function ticketTitleContains(value: string): SQL {
  return sql`${tickets.title} ilike ${literalLikePattern(value)} escape '\\'`;
}

function ticketPredicates(filters: OpenTicketQueryFilters): SQL[] {
  const predicates: SQL[] = [eq(tickets.status, "open")];

  if (filters.ticketId && isRecordId(filters.ticketId)) {
    predicates.push(eq(tickets.id, filters.ticketId));
  }

  if (filters.clientId && isRecordId(filters.clientId)) {
    predicates.push(eq(tickets.clientId, filters.clientId));
  }

  if (filters.buildingId && isRecordId(filters.buildingId)) {
    predicates.push(eq(tickets.buildingId, filters.buildingId));
  }

  if (filters.areaId && isRecordId(filters.areaId)) {
    predicates.push(eq(tickets.areaId, filters.areaId));
  }

  const search = parseTicketSearch(filters.search);
  if (search.term) {
    const titleMatch = ticketTitleContains(search.term);
    predicates.push(
      search.ticketNumber
        ? (or(eq(tickets.ticketNumber, search.ticketNumber), titleMatch) ?? titleMatch)
        : titleMatch,
    );
  }

  return predicates;
}

function addOpenTicketRow(
  summaries: Map<string, OpenTicketSummary>,
  row: OpenTicketHydrationRow,
): void {
  const current = summaries.get(row.ticket.id);

  if (current) {
    if (row.evidence) {
      current.beforePhotos.push(row.evidence);
    }
    return;
  }

  summaries.set(row.ticket.id, {
    id: row.ticket.id,
    ticketNumber: row.ticket.ticketNumber,
    displayNumber: formatTicketNumber(row.ticket.ticketNumber),
    title: row.ticket.title,
    clientId: row.ticket.clientId,
    buildingId: row.ticket.buildingId,
    areaId: row.ticket.areaId,
    clientName: row.inspection.clientNameSnapshot,
    buildingName: row.inspection.buildingNameSnapshot,
    areaName: row.areaInspection.areaNameSnapshot,
    inspectionSubmittedAt: row.inspection.submittedAt,
    submittedByEmail: row.inspection.submittedByEmail,
    failedItemName: row.item.itemNameSnapshot,
    failedItemDescription: row.item.itemDescriptionSnapshot,
    issueNote: row.item.resultNote,
    beforePhotos: row.evidence ? [row.evidence] : [],
    createdAt: row.ticket.createdAt,
  });
}

async function queryOpenTickets(
  filters: OpenTicketQueryFilters = {},
): Promise<OpenTicketSummary[]> {
  const { db } = await import("@/db/client");
  const predicates = ticketPredicates(filters);
  const rows: OpenTicketHydrationRow[] = await db
    .select({
      ticket: tickets,
      client: { name: clients.name },
      building: { name: buildings.name },
      inspection: {
        clientNameSnapshot: inspections.clientNameSnapshot,
        buildingNameSnapshot: inspections.buildingNameSnapshot,
        submittedAt: inspections.submittedAt,
        submittedByEmail: inspections.submittedByEmail,
      },
      areaInspection: {
        areaNameSnapshot: inspectionAreaInspections.areaNameSnapshot,
      },
      item: {
        itemNameSnapshot: inspectionItems.itemNameSnapshot,
        itemDescriptionSnapshot: inspectionItems.itemDescriptionSnapshot,
        resultNote: inspectionItems.resultNote,
      },
      evidence: {
        id: inspectionItemEvidence.id,
        storagePath: inspectionItemEvidence.storagePath,
      },
    })
    .from(tickets)
    .innerJoin(clients, eq(clients.id, tickets.clientId))
    .innerJoin(buildings, eq(buildings.id, tickets.buildingId))
    .innerJoin(inspections, eq(inspections.id, tickets.inspectionId))
    .innerJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.id, tickets.areaInspectionId),
    )
    .innerJoin(inspectionItems, eq(inspectionItems.id, tickets.inspectionItemId))
    .leftJoin(
      inspectionItemEvidence,
      and(
        eq(inspectionItemEvidence.inspectionItemId, tickets.inspectionItemId),
        eq(inspectionItemEvidence.evidenceType, "before_photo"),
      ),
    )
    .where(and(...predicates))
    .orderBy(desc(tickets.createdAt), desc(tickets.ticketNumber));

  const summaries = new Map<string, OpenTicketSummary>();
  rows.forEach((row) => addOpenTicketRow(summaries, row));

  return [...summaries.values()];
}

function validateCloseTicketInput(input: CloseTicketInput): void {
  const fields = validateCloseTicketProof({
    ticketId: input.ticketId,
    resolutionNote: input.resolutionNote,
    afterPhotoCount: input.afterPhotoStoragePaths.length,
  });

  if (Object.keys(fields).length > 0) {
    throw new TicketClosureValidationError(fields);
  }
}

export async function listOpenTickets(
  filters: ListOpenTicketFilters = {},
): Promise<OpenTicketSummary[]> {
  return queryOpenTickets(filters);
}

export async function getOpenTicket(
  ticketId: string,
): Promise<OpenTicketSummary | null> {
  if (!isRecordId(ticketId)) {
    return null;
  }

  const [ticket] = await queryOpenTickets({ ticketId });

  return ticket ?? null;
}

export async function getTicket(ticketId: string): Promise<TicketDetail | null> {
  if (!isRecordId(ticketId)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const [row] = await db
    .select({
      ticket: tickets,
      client: { name: clients.name },
      building: { name: buildings.name },
      inspection: {
        clientNameSnapshot: inspections.clientNameSnapshot,
        buildingNameSnapshot: inspections.buildingNameSnapshot,
        submittedAt: inspections.submittedAt,
        submittedByEmail: inspections.submittedByEmail,
      },
      areaInspection: {
        areaNameSnapshot: inspectionAreaInspections.areaNameSnapshot,
      },
      item: {
        itemNameSnapshot: inspectionItems.itemNameSnapshot,
        itemDescriptionSnapshot: inspectionItems.itemDescriptionSnapshot,
        resultNote: inspectionItems.resultNote,
      },
    })
    .from(tickets)
    .innerJoin(clients, eq(clients.id, tickets.clientId))
    .innerJoin(buildings, eq(buildings.id, tickets.buildingId))
    .innerJoin(inspections, eq(inspections.id, tickets.inspectionId))
    .innerJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.id, tickets.areaInspectionId),
    )
    .innerJoin(inspectionItems, eq(inspectionItems.id, tickets.inspectionItemId))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [beforePhotos, afterPhotos] = await Promise.all([
    db
      .select({ id: inspectionItemEvidence.id, storagePath: inspectionItemEvidence.storagePath })
      .from(inspectionItemEvidence)
      .where(eq(inspectionItemEvidence.inspectionItemId, row.ticket.inspectionItemId))
      .orderBy(asc(inspectionItemEvidence.uploadedAt), asc(inspectionItemEvidence.id)),
    db
      .select({ id: ticketAfterPhotoEvidence.id, storagePath: ticketAfterPhotoEvidence.storagePath })
      .from(ticketAfterPhotoEvidence)
      .where(eq(ticketAfterPhotoEvidence.ticketId, row.ticket.id))
      .orderBy(asc(ticketAfterPhotoEvidence.uploadedAt), asc(ticketAfterPhotoEvidence.id)),
  ]);

  return {
    id: row.ticket.id,
    status: row.ticket.status as "open" | "closed",
    ticketNumber: row.ticket.ticketNumber,
    displayNumber: formatTicketNumber(row.ticket.ticketNumber),
    title: row.ticket.title,
    clientId: row.ticket.clientId,
    buildingId: row.ticket.buildingId,
    areaId: row.ticket.areaId,
    clientName: row.inspection.clientNameSnapshot,
    buildingName: row.inspection.buildingNameSnapshot,
    areaName: row.areaInspection.areaNameSnapshot,
    inspectionSubmittedAt: row.inspection.submittedAt,
    submittedByEmail: row.inspection.submittedByEmail,
    failedItemName: row.item.itemNameSnapshot,
    failedItemDescription: row.item.itemDescriptionSnapshot,
    issueNote: row.item.resultNote,
    beforePhotos,
    afterPhotos,
    resolutionNote: row.ticket.resolutionNote,
    closedByEmail: row.ticket.closedByEmail,
    closedAt: row.ticket.closedAt,
    createdAt: row.ticket.createdAt,
  };
}

export async function closeTicket(
  input: CloseTicketInput,
  closer: TicketCloser,
): Promise<{ id: string; status: "closed" }> {
  validateCloseTicketInput(input);
  const { db } = await import("@/db/client");

  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, input.ticketId))
      .for("update")
      .limit(1);

    if (!ticket) {
      throw new TicketNotFoundError();
    }

    if (ticket.status === "closed") {
      throw new TicketAlreadyClosedError();
    }

    const [closed] = await tx
      .update(tickets)
      .set({
        status: "closed",
        resolutionNote: input.resolutionNote.trim(),
        closedByAuthUserId: closer.authUserId,
        closedByEmail: closer.email,
        closedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(tickets.id, input.ticketId), eq(tickets.status, "open")))
      .returning({ id: tickets.id, status: tickets.status });

    if (!closed) {
      throw new TicketAlreadyClosedError();
    }

    await tx.insert(ticketAfterPhotoEvidence).values(
      input.afterPhotoStoragePaths.map((storagePath) => ({
        ticketId: input.ticketId,
        storagePath,
        uploadedByAuthUserId: closer.authUserId,
      })),
    );

    return { id: closed.id, status: "closed" };
  });
}
