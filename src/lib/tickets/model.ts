const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TicketStatus = "open" | "closed";

export type ParsedTicketSearch = {
  term: string;
  ticketNumber: number | null;
};

export type CloseTicketFormValues = {
  ticketId: string;
  resolutionNote: string;
};

export type CloseTicketFieldErrors = Partial<
  Record<"ticketId" | "resolutionNote" | "afterPhotos", string>
>;

export type CloseTicketFormData = CloseTicketFormValues & {
  afterPhotos: File[];
};

export type CloseTicketParseResult =
  | { ok: true; data: CloseTicketFormData }
  | { ok: false; values: CloseTicketFormValues; errors: CloseTicketFieldErrors };

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readPhotos(formData: FormData): File[] {
  return formData
    .getAll("afterPhotos")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export function formatTicketNumber(ticketNumber: number): string {
  return `T-${ticketNumber.toString().padStart(6, "0")}`;
}

export function parseTicketSearch(value: string | undefined): ParsedTicketSearch {
  const term = value?.trim() ?? "";

  if (!term) {
    return { term: "", ticketNumber: null };
  }

  const numberText = term.match(/^(?:t-)?0*(\d+)$/i)?.[1];
  const ticketNumber = numberText ? Number(numberText) : null;

  return {
    term,
    ticketNumber: ticketNumber && Number.isSafeInteger(ticketNumber) ? ticketNumber : null,
  };
}

export function validateCloseTicketProof(input: {
  ticketId: string;
  resolutionNote: string;
  afterPhotoCount: number;
}): CloseTicketFieldErrors {
  const errors: CloseTicketFieldErrors = {};

  if (!UUID_PATTERN.test(input.ticketId)) {
    errors.ticketId = "Choose an Open Ticket.";
  }

  if (!input.resolutionNote.trim()) {
    errors.resolutionNote = "Enter a resolution note.";
  }

  if (input.afterPhotoCount === 0) {
    errors.afterPhotos = "Attach at least one After Photo.";
  }

  return errors;
}

export function parseCloseTicketFormData(
  formData: FormData,
): CloseTicketParseResult {
  const values = {
    ticketId: readString(formData, "ticketId"),
    resolutionNote: readString(formData, "resolutionNote"),
  };
  const afterPhotos = readPhotos(formData);
  const errors = validateCloseTicketProof({
    ticketId: values.ticketId,
    resolutionNote: values.resolutionNote,
    afterPhotoCount: afterPhotos.length,
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors };
  }

  return { ok: true, data: { ...values, afterPhotos } };
}
