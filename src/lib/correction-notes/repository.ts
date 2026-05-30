import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { correctionNotes, inspections, tickets } from "@/db/schema";

import {
  validateCorrectionNoteInput,
  validateCorrectionNoteTarget,
  type AddCorrectionNoteInput,
  type CorrectionNoteRecord,
  type CorrectionNoteTargetType,
} from "./model";

export type CorrectionNoteAuthor = {
  authUserId: string;
  email: string;
};

export type CorrectionNoteTarget = {
  targetType: CorrectionNoteTargetType;
  targetId: string;
};

type CorrectionNoteRow = typeof correctionNotes.$inferSelect;

export class CorrectionNoteValidationError extends Error {
  readonly fields: ReturnType<typeof validateCorrectionNoteInput>;

  constructor(fields: ReturnType<typeof validateCorrectionNoteInput>) {
    super("Correction Note is invalid.");
    this.name = "CorrectionNoteValidationError";
    this.fields = fields;
  }
}

export class CorrectionNoteTargetNotFoundError extends Error {
  constructor() {
    super("Correction Note target was not found.");
    this.name = "CorrectionNoteTargetNotFoundError";
  }
}

export class CorrectionNoteTargetNotAllowedError extends Error {
  constructor() {
    super("Correction Notes can only target Submitted Inspections and Tickets.");
    this.name = "CorrectionNoteTargetNotAllowedError";
  }
}

export function isCorrectionNoteValidationError(
  error: unknown,
): error is CorrectionNoteValidationError {
  return error instanceof CorrectionNoteValidationError;
}

export function isCorrectionNoteTargetNotFoundError(
  error: unknown,
): error is CorrectionNoteTargetNotFoundError {
  return error instanceof CorrectionNoteTargetNotFoundError;
}

export function isCorrectionNoteTargetNotAllowedError(
  error: unknown,
): error is CorrectionNoteTargetNotAllowedError {
  return error instanceof CorrectionNoteTargetNotAllowedError;
}

function toCorrectionNoteRecord(row: CorrectionNoteRow): CorrectionNoteRecord {
  return {
    id: row.id,
    targetType: row.targetType as CorrectionNoteTargetType,
    targetId: row.targetType === "ticket" ? row.ticketId ?? "" : row.inspectionId ?? "",
    note: row.note,
    createdByAuthUserId: row.createdByAuthUserId,
    createdByEmail: row.createdByEmail,
    createdAt: row.createdAt,
  };
}

function assertValidInput(input: AddCorrectionNoteInput): void {
  const fields = validateCorrectionNoteInput(input);

  if (Object.keys(fields).length > 0) {
    throw new CorrectionNoteValidationError(fields);
  }
}

async function assertTargetAllowsCorrectionNote(
  input: AddCorrectionNoteInput,
): Promise<void> {
  const { db } = await import("@/db/client");

  if (input.targetType === "submitted_inspection") {
    const [inspection] = await db
      .select({ id: inspections.id, status: inspections.status })
      .from(inspections)
      .where(eq(inspections.id, input.targetId))
      .for("update")
      .limit(1);

    if (!inspection) {
      throw new CorrectionNoteTargetNotFoundError();
    }

    if (inspection.status !== "submitted") {
      throw new CorrectionNoteTargetNotAllowedError();
    }

    return;
  }

  const [ticket] = await db
    .select({ id: tickets.id, status: tickets.status })
    .from(tickets)
    .where(eq(tickets.id, input.targetId))
    .for("update")
    .limit(1);

  if (!ticket) {
    throw new CorrectionNoteTargetNotFoundError();
  }
}

export async function addCorrectionNote(
  input: AddCorrectionNoteInput,
  author: CorrectionNoteAuthor,
): Promise<CorrectionNoteRecord> {
  assertValidInput(input);
  await assertTargetAllowsCorrectionNote(input);

  const { db } = await import("@/db/client");
  const [note] = await db
    .insert(correctionNotes)
    .values({
      targetType: input.targetType,
      inspectionId: input.targetType === "submitted_inspection" ? input.targetId : null,
      ticketId: input.targetType === "ticket" ? input.targetId : null,
      note: input.note.trim(),
      createdByAuthUserId: author.authUserId,
      createdByEmail: author.email,
    })
    .returning();

  if (!note) {
    throw new Error("Correction Note could not be saved.");
  }

  return toCorrectionNoteRecord(note);
}

export async function listCorrectionNotes(
  target: CorrectionNoteTarget,
): Promise<CorrectionNoteRecord[]> {
  const fields = validateCorrectionNoteTarget(target);

  if (fields.targetId || fields.targetType) {
    return [];
  }

  const { db } = await import("@/db/client");
  const predicate =
    target.targetType === "ticket"
      ? eq(correctionNotes.ticketId, target.targetId)
      : eq(correctionNotes.inspectionId, target.targetId);
  const rows: CorrectionNoteRow[] = await db
    .select()
    .from(correctionNotes)
    .where(predicate)
    .orderBy(asc(correctionNotes.createdAt), asc(correctionNotes.id));

  return rows.map(toCorrectionNoteRecord);
}

export async function getSubmittedInspectionCorrectionNoteTarget(
  inspectionId: string,
): Promise<{ id: string; clientName: string; buildingName: string; submittedAt: Date | null; submittedByEmail: string | null } | null> {
  const fields = validateCorrectionNoteTarget({
    targetType: "submitted_inspection",
    targetId: inspectionId,
  });

  if (fields.targetId) {
    return null;
  }

  const { db } = await import("@/db/client");
  const [inspection] = await db
    .select({
      id: inspections.id,
      clientName: inspections.clientNameSnapshot,
      buildingName: inspections.buildingNameSnapshot,
      submittedAt: inspections.submittedAt,
      submittedByEmail: inspections.submittedByEmail,
    })
    .from(inspections)
    .where(and(eq(inspections.id, inspectionId), eq(inspections.status, "submitted")))
    .limit(1);

  return inspection ?? null;
}
