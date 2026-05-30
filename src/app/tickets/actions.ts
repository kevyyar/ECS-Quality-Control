"use server";

import { requireProtectedAction } from "@/lib/auth/session";
import { processEvidencePhoto } from "@/lib/evidence/photo-processing";
import {
  removeEvidencePhoto,
  uploadTicketAfterPhoto,
} from "@/lib/evidence/storage";
import { parseCloseTicketFormData } from "@/lib/tickets/model";
import { logOperationalError } from "@/lib/observability/logger";
import {
  closeTicket,
  isTicketAlreadyClosedError,
  isTicketNotFoundError,
} from "@/lib/tickets/repository";

import { revalidateTicketViews } from "./revalidation";

export type CloseTicketActionState =
  | { status: "idle" }
  | { status: "success"; message: string; ticketId: string }
  | {
      status: "error";
      errors: Partial<Record<"ticketId" | "resolutionNote" | "afterPhotos", string>>;
      values: { ticketId: string; resolutionNote: string };
      formError?: string;
    };

function ticketClosureErrorMessage(error: unknown): string | undefined {
  if (isTicketNotFoundError(error)) {
    return "Ticket was not found.";
  }

  if (isTicketAlreadyClosedError(error)) {
    return "Ticket is already Closed.";
  }

  return undefined;
}

async function removeUploadedPhotos(storagePaths: string[]): Promise<void> {
  await Promise.all(
    storagePaths.map((storagePath) =>
      removeEvidencePhoto(storagePath).catch(() => undefined),
    ),
  );
}

export async function closeTicketAction(
  _previousState: CloseTicketActionState,
  formData: FormData,
): Promise<CloseTicketActionState> {
  const user = await requireProtectedAction("closeTicket");
  const parsed = parseCloseTicketFormData(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      errors: parsed.errors,
      values: parsed.values,
    };
  }

  const uploadedPaths: string[] = [];

  try {
    for (const photo of parsed.data.afterPhotos) {
      try {
        const processed = await processEvidencePhoto(photo);
        const storagePath = await uploadTicketAfterPhoto({
          ticketId: parsed.data.ticketId,
          photo: processed,
        });
        uploadedPaths.push(storagePath);
      } catch (error) {
        logOperationalError("photo.after.upload.failed", error, {
          workflow: "photo.after.upload",
          ticketId: parsed.data.ticketId,
          photoSize: photo.size,
        });
        throw error;
      }
    }

    await closeTicket(
      {
        ticketId: parsed.data.ticketId,
        resolutionNote: parsed.data.resolutionNote,
        afterPhotoStoragePaths: uploadedPaths,
      },
      user,
    );
  } catch (error) {
    logOperationalError("ticket.close.failed", error, {
      workflow: "ticket.close",
      ticketId: parsed.data.ticketId,
      afterPhotoCount: parsed.data.afterPhotos.length,
      uploadedPhotoCount: uploadedPaths.length,
      authUserId: user.authUserId,
    });
    await removeUploadedPhotos(uploadedPaths);

    return {
      status: "error",
      errors: {},
      values: {
        ticketId: parsed.data.ticketId,
        resolutionNote: parsed.data.resolutionNote,
      },
      formError: ticketClosureErrorMessage(error) ?? "Ticket could not be closed.",
    };
  }

  revalidateTicketViews(parsed.data.ticketId);

  return {
    status: "success",
    message: "Ticket closed.",
    ticketId: parsed.data.ticketId,
  };
}
