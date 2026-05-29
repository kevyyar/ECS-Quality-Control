import { isSetupRecordId } from "@/lib/client-building-setup/model";

export type InspectionStatus = "draft" | "submitted";

export type StartDraftInspectionInput = {
  buildingId: string;
};

export type DraftInspectionStarter = {
  authUserId: string;
  email: string;
};

export type StartDraftInspectionFormValues = {
  buildingId: string;
};

export type StartDraftInspectionFieldErrors = Partial<{
  buildingId: string;
}>;

export type StartDraftInspectionParseResult =
  | { ok: true; data: StartDraftInspectionInput }
  | {
      ok: false;
      errors: StartDraftInspectionFieldErrors;
      values: StartDraftInspectionFormValues;
    };

export type DraftInspectionItemRecord = {
  id: string;
  areaInspectionId: string;
  sourceTemplateItemId: string | null;
  sourceTemplateSectionId: string | null;
  position: number;
  sectionNameSnapshot: string | null;
  itemNameSnapshot: string;
  itemDescriptionSnapshot: string | null;
};

export type DraftAreaInspectionRecord = {
  id: string;
  inspectionId: string;
  source: "planned" | "one_off";
  position: number;
  areaId: string;
  areaTypeId: string;
  inspectionTemplateId: string;
  areaNameSnapshot: string;
  areaTypeNameSnapshot: string;
  inspectionTemplateNameSnapshot: string;
  inspectionTemplateDescriptionSnapshot: string | null;
  items: DraftInspectionItemRecord[];
};

export type DraftInspectionRecord = {
  id: string;
  status: "draft";
  clientId: string;
  buildingId: string;
  clientNameSnapshot: string;
  buildingNameSnapshot: string;
  startedByAuthUserId: string;
  startedByEmail: string;
  startedAt: Date;
  areaInspections: DraftAreaInspectionRecord[];
};

export type ActiveDraftInspectionSummaryRecord = {
  id: string;
  buildingId: string;
  clientId: string;
  buildingNameSnapshot: string;
  clientNameSnapshot: string;
  startedByEmail: string;
  startedAt: Date;
  areaInspectionCount: number;
  itemCount: number;
};

function trimFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function parseStartDraftInspectionFormData(
  formData: FormData,
): StartDraftInspectionParseResult {
  const values = { buildingId: trimFormValue(formData, "buildingId") };

  if (!isSetupRecordId(values.buildingId)) {
    return {
      ok: false,
      errors: { buildingId: "Select a Building." },
      values,
    };
  }

  return { ok: true, data: values };
}

export function isReportableInspectionStatus(status: InspectionStatus): boolean {
  return status === "submitted";
}
