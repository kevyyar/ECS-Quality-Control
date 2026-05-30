"use server";

import { requireProtectedAction } from "@/lib/auth/session";
import { parseAddCorrectionNoteFormData } from "@/lib/correction-notes/model";
import {
  addCorrectionNote,
  isCorrectionNoteTargetNotAllowedError,
  isCorrectionNoteTargetNotFoundError,
} from "@/lib/correction-notes/repository";

import { revalidateCorrectionNoteTarget } from "./revalidation";

export type AddCorrectionNoteActionState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      targetType: "submitted_inspection" | "ticket";
      targetId: string;
    }
  | {
      status: "error";
      errors: Partial<Record<"targetType" | "targetId" | "note", string>>;
      values: { targetType: string; targetId: string; note: string };
      formError?: string;
    };

function correctionNoteErrorMessage(error: unknown): string | undefined {
  if (isCorrectionNoteTargetNotFoundError(error)) {
    return "Correction Note target was not found.";
  }

  if (isCorrectionNoteTargetNotAllowedError(error)) {
    return "Correction Notes can only target Submitted Inspections and Tickets.";
  }

  return undefined;
}

export async function addCorrectionNoteAction(
  _previousState: AddCorrectionNoteActionState,
  formData: FormData,
): Promise<AddCorrectionNoteActionState> {
  const user = await requireProtectedAction("addCorrectionNote");
  const parsed = parseAddCorrectionNoteFormData(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      errors: parsed.errors,
      values: parsed.values,
    };
  }

  try {
    await addCorrectionNote(parsed.data, user);
  } catch (error) {
    return {
      status: "error",
      errors: {},
      values: parsed.data,
      formError: correctionNoteErrorMessage(error) ?? "Correction Note could not be added.",
    };
  }

  revalidateCorrectionNoteTarget(parsed.data.targetType, parsed.data.targetId);

  return {
    status: "success",
    message: "Correction Note added.",
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
  };
}
