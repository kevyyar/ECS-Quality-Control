export type SetupVisibility = "active" | "historical";

export type ClientInput = {
  name: string;
};

export type BuildingInput = {
  clientId: string;
  name: string;
};

export type AreaTypeInput = {
  name: string;
};

export type AreaInput = {
  buildingId: string;
  areaTypeId: string;
  name: string;
};

export type InspectionTemplateSectionInput = {
  name: string;
  position: number;
};

export type InspectionTemplateItemInput = {
  name: string;
  description: string;
  sectionName: string | null;
  position: number;
};

export type InspectionTemplateInput = {
  name: string;
  description: string;
  sections: InspectionTemplateSectionInput[];
  items: InspectionTemplateItemInput[];
};

export type BuildingInspectionPlanEntryInput = {
  areaId: string;
  inspectionTemplateId: string;
  position: number;
};

export type BuildingInspectionPlanInput = {
  buildingId: string;
  entries: BuildingInspectionPlanEntryInput[];
};

export const STARTER_INSPECTION_TEMPLATES: InspectionTemplateInput[] = [
  {
    name: "Restroom",
    description: "Starter Inspection Template for restroom Areas.",
    sections: [],
    items: [
      {
        name: "Fixtures",
        description: "Sinks, toilets, urinals, and dispensers are clean and stocked.",
        sectionName: null,
        position: 1,
      },
      {
        name: "Floors",
        description: "Floors are clean, dry, and free of debris.",
        sectionName: null,
        position: 2,
      },
      {
        name: "Mirrors",
        description: "Mirrors are clean and streak-free.",
        sectionName: null,
        position: 3,
      },
    ],
  },
  {
    name: "Office",
    description: "Starter Inspection Template for office Areas.",
    sections: [],
    items: [
      {
        name: "Work surfaces",
        description: "Desks, tables, and counters are clean.",
        sectionName: null,
        position: 1,
      },
      {
        name: "Trash",
        description: "Trash and recycling are removed.",
        sectionName: null,
        position: 2,
      },
      {
        name: "Floors",
        description: "Floors are vacuumed or mopped and free of debris.",
        sectionName: null,
        position: 3,
      },
    ],
  },
  {
    name: "Hallway",
    description: "Starter Inspection Template for hallway Areas.",
    sections: [],
    items: [
      {
        name: "Floors",
        description: "Floors are clean and free of debris.",
        sectionName: null,
        position: 1,
      },
      {
        name: "Walls and doors",
        description: "Walls, doors, and touch points are clean.",
        sectionName: null,
        position: 2,
      },
      {
        name: "Trash",
        description: "Trash containers are emptied and clean.",
        sectionName: null,
        position: 3,
      },
    ],
  },
  {
    name: "Lobby",
    description: "Starter Inspection Template for lobby Areas.",
    sections: [],
    items: [
      {
        name: "Entry glass",
        description: "Entry glass and doors are clean.",
        sectionName: null,
        position: 1,
      },
      {
        name: "Reception surfaces",
        description: "Reception surfaces are clean and organized.",
        sectionName: null,
        position: 2,
      },
      {
        name: "Floors",
        description: "Floors are clean and presentable.",
        sectionName: null,
        position: 3,
      },
    ],
  },
];

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

export type AreaTypeSetupRecord = {
  id: string;
  name: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
};

export type InspectionTemplateSectionRecord = {
  id: string;
  templateId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type InspectionTemplateItemRecord = {
  id: string;
  templateId: string;
  sectionId: string | null;
  sectionName: string | null;
  name: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type InspectionTemplateSetupRecord = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  sections: InspectionTemplateSectionRecord[];
  items: InspectionTemplateItemRecord[];
};

export type BuildingInspectionPlanEntryRecord = {
  id: string;
  planId: string;
  areaId: string;
  areaName: string;
  areaArchivedAt: Date | null;
  areaTypeArchivedAt: Date | null;
  inspectionTemplateId: string;
  inspectionTemplateName: string;
  inspectionTemplateArchivedAt: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  isAreaActive: boolean;
  isInspectionTemplateActive: boolean;
  isActive: boolean;
};

export type BuildingInspectionPlanRecord = {
  id: string;
  buildingId: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  buildingArchivedAt: Date | null;
  clientArchivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isBuildingActive: boolean;
  entries: BuildingInspectionPlanEntryRecord[];
};

export type BuildingInspectionPlanSummaryRecord = {
  buildingId: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  buildingArchivedAt: Date | null;
  clientArchivedAt: Date | null;
  planId: string | null;
  entryCount: number;
  activeEntryCount: number;
  staleEntryCount: number;
  updatedAt: Date | null;
  /** True when at least one saved Area/template pair is still active and usable. */
  isConfigured: boolean;
  isBuildingActive: boolean;
};

/** Archive timestamps needed to decide whether a saved plan entry is still usable. */
export type BuildingInspectionPlanEntryActiveContext = {
  areaArchivedAt: Date | null;
  areaTypeArchivedAt: Date | null;
  buildingArchivedAt: Date | null;
  clientArchivedAt: Date | null;
  inspectionTemplateArchivedAt: Date | null;
};

/**
 * Saved Building Inspection Plan entry rows are replaceable setup configuration.
 * `saveBuildingInspectionPlan` deletes and reinserts entries on each save, so
 * `building_inspection_plan_entries.id` values are not stable over time.
 * Future Draft and Submitted Inspection persistence must copy area names, template
 * names, and template item content into inspection-owned rows when an inspection
 * starts or is submitted — never foreign-key to plan entry ids.
 */
export const BUILDING_INSPECTION_PLAN_ENTRY_SNAPSHOT_CONTRACT =
  "Draft and Submitted Inspection records must snapshot plan content at inspection time and must not reference building_inspection_plan_entries.id." as const;

export function isBuildingInspectionPlanEntryAreaActive(
  context: Pick<
    BuildingInspectionPlanEntryActiveContext,
    "areaArchivedAt" | "areaTypeArchivedAt" | "buildingArchivedAt" | "clientArchivedAt"
  >,
): boolean {
  return (
    context.areaArchivedAt === null &&
    context.areaTypeArchivedAt === null &&
    context.buildingArchivedAt === null &&
    context.clientArchivedAt === null
  );
}

export function isBuildingInspectionPlanInspectionTemplateActive(
  inspectionTemplateArchivedAt: Date | null,
): boolean {
  return inspectionTemplateArchivedAt === null;
}

export function isBuildingInspectionPlanEntryActive(
  context: BuildingInspectionPlanEntryActiveContext,
): boolean {
  return (
    isBuildingInspectionPlanEntryAreaActive(context) &&
    isBuildingInspectionPlanInspectionTemplateActive(context.inspectionTemplateArchivedAt)
  );
}

export type BuildingInspectionPlanEntryCountSummary = {
  entryCount: number;
  activeEntryCount: number;
  staleEntryCount: number;
  isConfigured: boolean;
};

export function summarizeBuildingInspectionPlanEntryCounts(
  entries: ReadonlyArray<Pick<BuildingInspectionPlanEntryRecord, "isActive">>,
): BuildingInspectionPlanEntryCountSummary {
  const entryCount = entries.length;
  const activeEntryCount = entries.filter((entry) => entry.isActive).length;
  const staleEntryCount = entryCount - activeEntryCount;

  return {
    entryCount,
    activeEntryCount,
    staleEntryCount,
    isConfigured: activeEntryCount > 0,
  };
}

export type AreaSetupRecord = {
  id: string;
  buildingId: string;
  buildingName: string;
  clientId: string;
  clientName: string;
  areaTypeId: string;
  areaTypeName: string;
  name: string;
  archivedAt: Date | null;
  buildingArchivedAt: Date | null;
  clientArchivedAt: Date | null;
  areaTypeArchivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isBuildingArchived: boolean;
  isClientArchived: boolean;
  isAreaTypeArchived: boolean;
  isActive: boolean;
};

export type ClientField = keyof ClientInput;
export type BuildingField = keyof BuildingInput;
export type AreaTypeField = keyof AreaTypeInput;
export type AreaField = keyof AreaInput;
export type InspectionTemplateField = "name" | "description" | "items";
export type InspectionTemplateItemField = "name" | "description" | "sectionName";
export type BuildingInspectionPlanField = "buildingId" | "entries";
export type BuildingInspectionPlanEntryField = "areaId" | "inspectionTemplateId";

export type ClientFieldErrors = Partial<Record<ClientField, string>>;
export type BuildingFieldErrors = Partial<Record<BuildingField, string>>;
export type AreaTypeFieldErrors = Partial<Record<AreaTypeField, string>>;
export type AreaFieldErrors = Partial<Record<AreaField, string>>;
export type InspectionTemplateFieldErrors = Partial<
  Record<InspectionTemplateField, string>
>;
export type InspectionTemplateItemFieldErrors = Partial<
  Record<InspectionTemplateItemField, string>
>;
export type BuildingInspectionPlanFieldErrors = Partial<
  Record<BuildingInspectionPlanField, string>
>;
export type BuildingInspectionPlanEntryFieldErrors = Partial<
  Record<BuildingInspectionPlanEntryField, string>
>;

export type ClientFormValues = Record<ClientField, string>;
export type BuildingFormValues = Record<BuildingField, string>;
export type AreaTypeFormValues = Record<AreaTypeField, string>;
export type AreaFormValues = Record<AreaField, string>;
export type InspectionTemplateFormValues = {
  name: string;
  description: string;
  sections: Array<{
    name: string;
  }>;
  items: Array<{
    name: string;
    description: string;
    sectionName: string;
  }>;
};
export type BuildingInspectionPlanFormValues = {
  buildingId: string;
  entries: Array<{
    areaId: string;
    inspectionTemplateId: string;
  }>;
};

export type ClientParseResult =
  | { ok: true; data: ClientInput }
  | { ok: false; errors: ClientFieldErrors; values: ClientFormValues };

export type BuildingParseResult =
  | { ok: true; data: BuildingInput }
  | { ok: false; errors: BuildingFieldErrors; values: BuildingFormValues };

export type AreaTypeParseResult =
  | { ok: true; data: AreaTypeInput }
  | { ok: false; errors: AreaTypeFieldErrors; values: AreaTypeFormValues };

export type AreaParseResult =
  | { ok: true; data: AreaInput }
  | { ok: false; errors: AreaFieldErrors; values: AreaFormValues };

export type InspectionTemplateParseResult =
  | { ok: true; data: InspectionTemplateInput }
  | {
      ok: false;
      errors: InspectionTemplateFieldErrors;
      itemErrors: InspectionTemplateItemFieldErrors[];
      values: InspectionTemplateFormValues;
    };

export type BuildingInspectionPlanParseResult =
  | { ok: true; data: BuildingInspectionPlanInput }
  | {
      ok: false;
      errors: BuildingInspectionPlanFieldErrors;
      entryErrors: BuildingInspectionPlanEntryFieldErrors[];
      values: BuildingInspectionPlanFormValues;
    };

export type BuildingNameParseResult =
  | { ok: true; name: string }
  | { ok: false; error: string; value: string };

export type AreaNameParseResult =
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

function trimFormValues(formData: FormData, field: string): string[] {
  return formData
    .getAll(field)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
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

function areaTypeNameError(name: string): string | null {
  if (name === "") {
    return "Area Type name is required.";
  }

  if (name.length > 160) {
    return "Area Type name must be 160 characters or fewer.";
  }

  return null;
}

function areaNameError(name: string): string | null {
  if (name === "") {
    return "Area name is required.";
  }

  if (name.length > 160) {
    return "Area name must be 160 characters or fewer.";
  }

  return null;
}

function inspectionTemplateNameError(name: string): string | null {
  if (name === "") {
    return "Inspection Template name is required.";
  }

  if (name.length > 160) {
    return "Inspection Template name must be 160 characters or fewer.";
  }

  return null;
}

function inspectionTemplateDescriptionError(description: string): string | null {
  if (description.length > 1000) {
    return "Inspection Template description must be 1000 characters or fewer.";
  }

  return null;
}

function inspectionTemplateItemNameError(name: string): string | null {
  if (name === "") {
    return "Inspection Template item name is required.";
  }

  if (name.length > 160) {
    return "Inspection Template item name must be 160 characters or fewer.";
  }

  return null;
}

function inspectionTemplateItemDescriptionError(
  description: string,
): string | null {
  if (description.length > 1000) {
    return "Inspection Template item description must be 1000 characters or fewer.";
  }

  return null;
}

function inspectionTemplateSectionNameError(name: string): string | null {
  if (name.length > 160) {
    return "Template Section name must be 160 characters or fewer.";
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

export function parseAreaNameFormData(formData: FormData): AreaNameParseResult {
  const name = trimFormValue(formData, "name");
  const error = areaNameError(name);

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

export function parseInspectionTemplateFormData(
  formData: FormData,
): InspectionTemplateParseResult {
  const itemNames = formData.getAll("itemName");
  const itemDescriptions = formData.getAll("itemDescription");
  const itemSectionNames = formData.getAll("itemSectionName");
  const itemCount = Math.max(
    itemNames.length,
    itemDescriptions.length,
    itemSectionNames.length,
  );
  const sectionNames: string[] = [];
  const values: InspectionTemplateFormValues = {
    name: trimFormValue(formData, "name"),
    description: trimFormValue(formData, "description"),
    sections: [],
    items: Array.from({ length: itemCount }, (_, index) => {
      const sectionName =
        typeof itemSectionNames[index] === "string"
          ? itemSectionNames[index].trim()
          : "";

      if (sectionName !== "" && !sectionNames.includes(sectionName)) {
        sectionNames.push(sectionName);
      }

      return {
        name: typeof itemNames[index] === "string" ? itemNames[index].trim() : "",
        description:
          typeof itemDescriptions[index] === "string"
            ? itemDescriptions[index].trim()
            : "",
        sectionName,
      };
    }),
  };
  values.sections = sectionNames.map((name) => ({ name }));
  const errors: InspectionTemplateFieldErrors = {};
  const itemErrors = values.items.map((item) => {
    const errors: InspectionTemplateItemFieldErrors = {};
    const nameError = inspectionTemplateItemNameError(item.name);
    const descriptionError = inspectionTemplateItemDescriptionError(item.description);
    const sectionNameError = inspectionTemplateSectionNameError(item.sectionName);

    if (nameError) {
      errors.name = nameError;
    }

    if (descriptionError) {
      errors.description = descriptionError;
    }

    if (sectionNameError) {
      errors.sectionName = sectionNameError;
    }

    return errors;
  });
  const nameError = inspectionTemplateNameError(values.name);
  const descriptionError = inspectionTemplateDescriptionError(values.description);

  if (nameError) {
    errors.name = nameError;
  }

  if (descriptionError) {
    errors.description = descriptionError;
  }

  if (values.items.length === 0) {
    errors.items = "Add at least one Inspection Template item.";
  }

  if (
    Object.keys(errors).length > 0 ||
    itemErrors.some((itemError) => Object.keys(itemError).length > 0)
  ) {
    return { ok: false, errors, itemErrors, values };
  }

  return {
    ok: true,
    data: {
      name: values.name,
      description: values.description,
      sections: values.sections.map((section, index) => ({
        ...section,
        position: index + 1,
      })),
      items: values.items.map((item, index) => ({
        ...item,
        sectionName: item.sectionName === "" ? null : item.sectionName,
        position: index + 1,
      })),
    },
  };
}

export function parseBuildingInspectionPlanFormData(
  formData: FormData,
): BuildingInspectionPlanParseResult {
  const areaIds = trimFormValues(formData, "areaId");
  const templateIds = trimFormValues(formData, "inspectionTemplateId");
  const entryCount = Math.max(areaIds.length, templateIds.length);
  const values: BuildingInspectionPlanFormValues = {
    buildingId: trimFormValue(formData, "buildingId"),
    entries: Array.from({ length: entryCount }, (_, index) => ({
      areaId: areaIds[index] ?? "",
      inspectionTemplateId: templateIds[index] ?? "",
    })),
  };
  const errors: BuildingInspectionPlanFieldErrors = {};
  const entryErrors: BuildingInspectionPlanEntryFieldErrors[] = [];
  const seenAreaIds = new Set<string>();

  if (!isSetupRecordId(values.buildingId)) {
    errors.buildingId = "Select an active Building.";
  }

  if (values.entries.length === 0) {
    errors.entries = "Add at least one Area/template pair.";
  }

  values.entries.forEach((entry) => {
    const errors: BuildingInspectionPlanEntryFieldErrors = {};

    if (!isSetupRecordId(entry.areaId)) {
      errors.areaId = "Select an active Area.";
    } else if (seenAreaIds.has(entry.areaId)) {
      errors.areaId = "Each Area can appear only once in a Building Inspection Plan.";
    } else {
      seenAreaIds.add(entry.areaId);
    }

    if (!isSetupRecordId(entry.inspectionTemplateId)) {
      errors.inspectionTemplateId = "Select an active Inspection Template.";
    }

    entryErrors.push(errors);
  });

  if (
    Object.keys(errors).length > 0 ||
    entryErrors.some((entryError) => Object.keys(entryError).length > 0)
  ) {
    return { ok: false, errors, entryErrors, values };
  }

  return {
    ok: true,
    data: {
      buildingId: values.buildingId,
      entries: values.entries.map((entry, index) => ({
        ...entry,
        position: index + 1,
      })),
    },
  };
}

export function parseAreaTypeFormData(formData: FormData): AreaTypeParseResult {
  const values: AreaTypeFormValues = {
    name: trimFormValue(formData, "name"),
  };
  const errors: AreaTypeFieldErrors = {};
  const nameError = areaTypeNameError(values.name);

  if (nameError) {
    errors.name = nameError;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

export function parseAreaFormData(formData: FormData): AreaParseResult {
  const values: AreaFormValues = {
    buildingId: trimFormValue(formData, "buildingId"),
    areaTypeId: trimFormValue(formData, "areaTypeId"),
    name: trimFormValue(formData, "name"),
  };
  const errors: AreaFieldErrors = {};

  if (!isSetupRecordId(values.buildingId)) {
    errors.buildingId = "Select an active Building.";
  }

  if (!isSetupRecordId(values.areaTypeId)) {
    errors.areaTypeId = "Select an active Area Type.";
  }

  const nameError = areaNameError(values.name);

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
