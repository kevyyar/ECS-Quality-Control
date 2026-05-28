export type SetupVisibility = "active" | "historical";

export type ClientInput = {
  name: string;
};

export type BuildingInput = {
  clientId: string;
  name: string;
};

export type ClientSetupRecord = {
  id: string;
  name: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
};

export type BuildingSetupRecord = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  archivedAt: Date | null;
  clientArchivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isParentArchived: boolean;
  isActive: boolean;
};

export type ClientField = keyof ClientInput;
export type BuildingField = keyof BuildingInput;

export type ClientFieldErrors = Partial<Record<ClientField, string>>;
export type BuildingFieldErrors = Partial<Record<BuildingField, string>>;

export type ClientFormValues = Record<ClientField, string>;
export type BuildingFormValues = Record<BuildingField, string>;

export type ClientParseResult =
  | { ok: true; data: ClientInput }
  | { ok: false; errors: ClientFieldErrors; values: ClientFormValues };

export type BuildingParseResult =
  | { ok: true; data: BuildingInput }
  | { ok: false; errors: BuildingFieldErrors; values: BuildingFormValues };

export type BuildingNameParseResult =
  | { ok: true; name: string }
  | { ok: false; error: string; value: string };

export type IdParseResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

export function isSetupRecordId(value: string): boolean {
  return uuidPattern.test(value);
}

export function parseClientFormData(formData: FormData): ClientParseResult {
  const values: ClientFormValues = {
    name: trimFormValue(formData, "name"),
  };
  const errors: ClientFieldErrors = {};

  if (values.name === "") {
    errors.name = "Client name is required.";
  } else if (values.name.length > 160) {
    errors.name = "Client name must be 160 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

function buildingNameError(name: string): string | null {
  if (name === "") {
    return "Building name is required.";
  }

  if (name.length > 160) {
    return "Building name must be 160 characters or fewer.";
  }

  return null;
}

export function parseBuildingNameFormData(
  formData: FormData,
): BuildingNameParseResult {
  const name = trimFormValue(formData, "name");
  const error = buildingNameError(name);

  if (error) {
    return { ok: false, error, value: name };
  }

  return { ok: true, name };
}

export function parseBuildingFormData(formData: FormData): BuildingParseResult {
  const values: BuildingFormValues = {
    clientId: trimFormValue(formData, "clientId"),
    name: trimFormValue(formData, "name"),
  };
  const errors: BuildingFieldErrors = {};

  if (!isSetupRecordId(values.clientId)) {
    errors.clientId = "Select an active Client.";
  }

  const nameError = buildingNameError(values.name);

  if (nameError) {
    errors.name = nameError;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

export function parseIdFormData(formData: FormData): IdParseResult {
  const id = trimFormValue(formData, "id");

  if (!isSetupRecordId(id)) {
    return { ok: false, error: "A valid setup record is required." };
  }

  return { ok: true, id };
}
