import { describe, expect, it } from "vitest";

import { correctionNotes, ticketAfterPhotoEvidence, tickets } from "./schema";

describe("database schema", () => {
  it("models app-wide sequential Ticket Numbers", () => {
    expect(tickets.ticketNumber.name).toBe("ticket_number");
  });

  it("stores Ticket closure metadata separately from inspection failure evidence", () => {
    expect(tickets.resolutionNote.name).toBe("resolution_note");
    expect(tickets.closedByAuthUserId.name).toBe("closed_by_auth_user_id");
    expect(tickets.closedAt.name).toBe("closed_at");
    expect(ticketAfterPhotoEvidence.ticketId.name).toBe("ticket_id");
    expect(ticketAfterPhotoEvidence.storagePath.name).toBe("storage_path");
  });

  it("stores additive Correction Notes for Submitted Inspections and Tickets", () => {
    expect(correctionNotes.targetType.name).toBe("target_type");
    expect(correctionNotes.inspectionId.name).toBe("inspection_id");
    expect(correctionNotes.ticketId.name).toBe("ticket_id");
    expect(correctionNotes.note.name).toBe("note");
    expect(correctionNotes.createdByAuthUserId.name).toBe("created_by_auth_user_id");
  });
});
