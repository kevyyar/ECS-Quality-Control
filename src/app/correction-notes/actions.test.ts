import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  addCorrectionNote,
  isCorrectionNoteTargetNotAllowedError,
  isCorrectionNoteTargetNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  addCorrectionNote: vi.fn(),
  isCorrectionNoteTargetNotAllowedError: (error: unknown) =>
    error instanceof Error && error.name === "CorrectionNoteTargetNotAllowedError",
  isCorrectionNoteTargetNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "CorrectionNoteTargetNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/correction-notes/repository", () => ({
  addCorrectionNote,
  isCorrectionNoteTargetNotAllowedError,
  isCorrectionNoteTargetNotFoundError,
}));

const { addCorrectionNoteAction } = await import("./actions");

const user = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "manager@example.com",
  capabilities: ["manager"],
};
const ticketId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const inspectionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("Correction Note actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue(user);
    addCorrectionNote.mockResolvedValue({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" });
  });

  it("requires correction-note capability", async () => {
    await addCorrectionNoteAction(
      { status: "idle" },
      formData({ targetType: "ticket", targetId: ticketId, note: "Clarifying note." }),
    );

    expect(requireProtectedAction).toHaveBeenCalledWith("addCorrectionNote");
  });

  it("returns validation errors without saving", async () => {
    await expect(addCorrectionNoteAction({ status: "idle" }, new FormData())).resolves.toEqual({
      status: "error",
      errors: {
        targetType: "Choose a Submitted Inspection or Ticket.",
        targetId: "Choose a Submitted Inspection or Ticket.",
        note: "Enter a Correction Note.",
      },
      values: { targetType: "", targetId: "", note: "" },
    });

    expect(addCorrectionNote).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("adds a Ticket Correction Note and revalidates Ticket views", async () => {
    await expect(
      addCorrectionNoteAction(
        { status: "idle" },
        formData({ targetType: "ticket", targetId: ticketId, note: "  Clarifying note.  " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Correction Note added.",
      targetType: "ticket",
      targetId: ticketId,
    });

    expect(addCorrectionNote).toHaveBeenCalledWith(
      { targetType: "ticket", targetId: ticketId, note: "Clarifying note." },
      user,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/tickets");
    expect(revalidatePath).toHaveBeenCalledWith(`/tickets/${ticketId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/tickets/${ticketId}/close`);
  });

  it("adds a Submitted Inspection Correction Note and revalidates inspection views", async () => {
    await addCorrectionNoteAction(
      { status: "idle" },
      formData({
        targetType: "submitted_inspection",
        targetId: inspectionId,
        note: "Inspection note.",
      }),
    );

    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/${inspectionId}`);
  });


  it("does not report mutation failure when post-save revalidation fails", async () => {
    revalidatePath.mockImplementation((path: string) => {
      if (path === "/dashboard") {
        throw new Error("revalidation failed");
      }
    });

    await expect(
      addCorrectionNoteAction(
        { status: "idle" },
        formData({ targetType: "ticket", targetId: ticketId, note: "Clarifying note." }),
      ),
    ).rejects.toThrow("revalidation failed");

    expect(addCorrectionNote).toHaveBeenCalled();
  });

  it("maps missing targets to a safe form error", async () => {
    addCorrectionNote.mockRejectedValueOnce(namedError("CorrectionNoteTargetNotFoundError"));

    await expect(
      addCorrectionNoteAction(
        { status: "idle" },
        formData({ targetType: "ticket", targetId: ticketId, note: "Missing note." }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      values: { targetType: "ticket", targetId: ticketId, note: "Missing note." },
      formError: "Correction Note target was not found.",
    });
  });

  it("maps blocked Draft Inspection targets to a safe form error", async () => {
    addCorrectionNote.mockRejectedValueOnce(namedError("CorrectionNoteTargetNotAllowedError"));

    await expect(
      addCorrectionNoteAction(
        { status: "idle" },
        formData({ targetType: "submitted_inspection", targetId: inspectionId, note: "Draft note." }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      values: { targetType: "submitted_inspection", targetId: inspectionId, note: "Draft note." },
      formError: "Correction Notes can only target Submitted Inspections and Tickets.",
    });
  });
});
