const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 1000;

export type CorrectionNoteTargetType = "submitted_inspection" | "ticket";

export type CorrectionNoteRecord = {
  id: string;
  targetType: CorrectionNoteTargetType;
  targetId: string;
  note: string;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdAt: Date;
};

export type AddCorrectionNoteFormValues = {
  targetType: string;
  targetId: string;
  note: string;
};

export type AddCorrectionNoteFieldErrors = Partial<
  Record<"targetType" | "targetId" | "note", string>
>;

export type AddCorrectionNoteInput = {
  targetType: CorrectionNoteTargetType;
  targetId: string;
  note: string;
};

export type AddCorrectionNoteParseResult =
  | { ok: true; data: AddCorrectionNoteInput }
  | {
      ok: false;
      values: AddCorrectionNoteFormValues;
      errors: AddCorrectionNoteFieldErrors;
    };

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isTargetType(value: string): value is CorrectionNoteTargetType {
  return value === "submitted_inspection" || value === "ticket";
}

export function validateCorrectionNoteTarget(values: {
  targetType: string;
  targetId: string;
}): AddCorrectionNoteFieldErrors {
  const errors: AddCorrectionNoteFieldErrors = {};

  if (!isTargetType(values.targetType)) {
    errors.targetType = "Choose a Submitted Inspection or Ticket.";
  }

  if (!UUID_PATTERN.test(values.targetId)) {
    errors.targetId = "Choose a Submitted Inspection or Ticket.";
  }

  return errors;
}

export function validateCorrectionNoteInput(
  values: AddCorrectionNoteFormValues,
): AddCorrectionNoteFieldErrors {
  const errors = validateCorrectionNoteTarget(values);

  if (!values.note) {
    errors.note = "Enter a Correction Note.";
  } else if (values.note.length > MAX_NOTE_LENGTH) {
    errors.note = "Correction Notes must be 1,000 characters or fewer.";
  }

  return errors;
}

export function parseAddCorrectionNoteFormData(
  formData: FormData,
): AddCorrectionNoteParseResult {
  const values = {
    targetType: readString(formData, "targetType"),
    targetId: readString(formData, "targetId"),
    note: readString(formData, "note"),
  };
  const errors = validateCorrectionNoteInput(values);

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors };
  }

  return {
    ok: true,
    data: {
      targetType: values.targetType as CorrectionNoteTargetType,
      targetId: values.targetId,
      note: values.note,
    },
  };
}
