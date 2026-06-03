import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  redirect,
  requireProtectedAction,
  closeTicket,
  processEvidencePhoto,
  uploadTicketAfterPhoto,
  removeEvidencePhoto,
  isTicketAlreadyClosedError,
  isTicketNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  requireProtectedAction: vi.fn(),
  closeTicket: vi.fn(),
  processEvidencePhoto: vi.fn(),
  uploadTicketAfterPhoto: vi.fn(),
  removeEvidencePhoto: vi.fn(),
  isTicketAlreadyClosedError: (error: unknown) =>
    error instanceof Error && error.name === "TicketAlreadyClosedError",
  isTicketNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "TicketNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/evidence/photo-processing", () => ({ processEvidencePhoto }));
vi.mock("@/lib/evidence/storage", () => ({
  uploadTicketAfterPhoto,
  removeEvidencePhoto,
}));
vi.mock("@/lib/tickets/repository", () => ({
  closeTicket,
  isTicketAlreadyClosedError,
  isTicketNotFoundError,
}));

const { closeTicketAction } = await import("./actions");

const ticketId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const supervisor = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "supervisor@example.com",
  capabilities: ["supervisor"],
};
const processedPhoto = { buffer: Buffer.from("processed"), contentType: "image/jpeg" };

function validFormData(): FormData {
  const data = new FormData();
  data.set("ticketId", ticketId);
  data.set("resolutionNote", "  Re-cleaned and verified.  ");
  data.append("afterPhotos", new File(["photo"], "after.jpg", { type: "image/jpeg" }));
  return data;
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("Ticket actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue(supervisor);
    processEvidencePhoto.mockResolvedValue(processedPhoto);
    uploadTicketAfterPhoto.mockResolvedValue(`${ticketId}/after/photo.jpg`);
    closeTicket.mockResolvedValue({ id: ticketId, status: "closed" });
    removeEvidencePhoto.mockResolvedValue(undefined);
  });

  it("requires Supervisor close-Ticket capability", async () => {
    await expect(closeTicketAction({ status: "idle" }, validFormData())).rejects.toThrow(
      `NEXT_REDIRECT:/tickets/${ticketId}`,
    );

    expect(requireProtectedAction).toHaveBeenCalledWith("closeTicket");
  });

  it("does not close Tickets when Manager-only users fail close capability", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(closeTicketAction({ status: "idle" }, validFormData())).rejects.toThrow(
      "redirect:/forbidden",
    );

    expect(processEvidencePhoto).not.toHaveBeenCalled();
    expect(uploadTicketAfterPhoto).not.toHaveBeenCalled();
    expect(closeTicket).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns field errors before uploading when closure proof is missing", async () => {
    await expect(closeTicketAction({ status: "idle" }, new FormData())).resolves.toEqual({
      status: "error",
      errors: {
        ticketId: "Choose an Open Ticket.",
        resolutionNote: "Enter a resolution note.",
        afterPhotos: "Attach at least one After Photo.",
      },
      values: { ticketId: "", resolutionNote: "" },
    });

    expect(processEvidencePhoto).not.toHaveBeenCalled();
    expect(closeTicket).not.toHaveBeenCalled();
  });

  it("uploads After Photos, closes the Ticket, and redirects to Ticket detail", async () => {
    await expect(closeTicketAction({ status: "idle" }, validFormData())).rejects.toThrow(
      `NEXT_REDIRECT:/tickets/${ticketId}`,
    );

    expect(uploadTicketAfterPhoto).toHaveBeenCalledWith({
      ticketId,
      photo: processedPhoto,
    });
    expect(closeTicket).toHaveBeenCalledWith(
      {
        ticketId,
        resolutionNote: "Re-cleaned and verified.",
        afterPhotoStoragePaths: [`${ticketId}/after/photo.jpg`],
      },
      supervisor,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/tickets");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith(`/tickets/${ticketId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/tickets/${ticketId}/close`);
    expect(redirect).toHaveBeenCalledWith(`/tickets/${ticketId}`);
  });


  it("does not remove committed After Photos when post-close revalidation fails", async () => {
    revalidatePath.mockImplementation((path: string) => {
      if (path === "/dashboard") {
        throw new Error("revalidation failed");
      }
    });

    await expect(closeTicketAction({ status: "idle" }, validFormData())).rejects.toThrow(
      "revalidation failed",
    );

    expect(closeTicket).toHaveBeenCalled();
    expect(removeEvidencePhoto).not.toHaveBeenCalled();
  });

  it("removes uploaded After Photos if closing the Ticket fails", async () => {
    closeTicket.mockRejectedValueOnce(namedError("TicketAlreadyClosedError"));

    await expect(closeTicketAction({ status: "idle" }, validFormData())).resolves.toEqual({
      status: "error",
      errors: {},
      values: { ticketId, resolutionNote: "Re-cleaned and verified." },
      formError: "Ticket is already Closed.",
    });

    expect(removeEvidencePhoto).toHaveBeenCalledWith(`${ticketId}/after/photo.jpg`);
  });
});
