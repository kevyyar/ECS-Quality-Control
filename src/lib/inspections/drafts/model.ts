import { isSetupRecordId } from "@/lib/client-building-setup/model";

export type InspectionStatus = "draft" | "submitted";
export type AreaInspectionSource = "planned" | "one_off";
export type InspectionItemResultStatus = "pass" | "fail" | "not_applicable";

const MAX_RESULT_NOTE_LENGTH = 1000;
const resultStatuses = new Set<string>(["pass", "fail", "not_applicable"]);

export type StartDraftInspectionInput = {
  buildingId: string;
};

export type DraftInspectionStarter = {
  authUserId: string;
  email: string;
};

export type SaveDraftInspectionItemResultInput = {
  inspectionId: string;
  itemId: string;
  resultStatus: InspectionItemResultStatus | null;
  resultNote: string;
};

export type SkipDraftAreaInspectionInput = {
  inspectionId: string;
  areaInspectionId: string;
  skipReason: string;
};

export type UnskipDraftAreaInspectionInput = {
  inspectionId: string;
  areaInspectionId: string;
};

export type AddOneOffAreaInspectionInput = {
  inspectionId: string;
  areaId: string;
  inspectionTemplateId: string;
};

export type SubmitDraftInspectionInput = {
  inspectionId: string;
  confirmSkippedPlannedAreas: boolean;
};

export type AddDraftInspectionItemBeforePhotoInput = {
  inspectionId: string;
  itemId: string;
  storagePath: string;
  uploadedByAuthUserId: string;
};

export type RemoveDraftInspectionItemBeforePhotoInput = {
  inspectionId: string;
  itemId: string;
  evidenceId: string;
};

export type DiscardDraftInspectionInput = {
  inspectionId: string;
};

export type StartDraftInspectionFormValues = {
  buildingId: string;
};

export type StartDraftInspectionFieldErrors = Partial<{
  buildingId: string;
}>;

export type SaveDraftInspectionItemResultFormValues = {
  inspectionId: string;
  itemId: string;
  resultStatus: string;
  resultNote: string;
};

export type SaveDraftInspectionItemResultFieldErrors = Partial<{
  inspectionId: string;
  itemId: string;
  resultStatus: string;
  resultNote: string;
}>;

export type SkipDraftAreaInspectionFormValues = {
  inspectionId: string;
  areaInspectionId: string;
  skipReason: string;
};

export type SkipDraftAreaInspectionFieldErrors = Partial<{
  inspectionId: string;
  areaInspectionId: string;
  skipReason: string;
}>;

export type AreaInspectionIdentityFormValues = {
  inspectionId: string;
  areaInspectionId: string;
};

export type AreaInspectionIdentityFieldErrors = Partial<{
  inspectionId: string;
  areaInspectionId: string;
}>;

export type AddOneOffAreaInspectionFormValues = {
  inspectionId: string;
  areaId: string;
  inspectionTemplateId: string;
};

export type AddOneOffAreaInspectionFieldErrors = Partial<{
  inspectionId: string;
  areaId: string;
  inspectionTemplateId: string;
}>;

export type DraftInspectionIdentityFormValues = {
  inspectionId: string;
};

export type DraftInspectionIdentityFieldErrors = Partial<{
  inspectionId: string;
}>;

export type StartDraftInspectionParseResult =
  | { ok: true; data: StartDraftInspectionInput }
  | {
      ok: false;
      errors: StartDraftInspectionFieldErrors;
      values: StartDraftInspectionFormValues;
    };

export type SaveDraftInspectionItemResultParseResult =
  | { ok: true; data: SaveDraftInspectionItemResultInput }
  | {
      ok: false;
      errors: SaveDraftInspectionItemResultFieldErrors;
      values: SaveDraftInspectionItemResultFormValues;
    };

export type SkipDraftAreaInspectionParseResult =
  | { ok: true; data: SkipDraftAreaInspectionInput }
  | {
      ok: false;
      errors: SkipDraftAreaInspectionFieldErrors;
      values: SkipDraftAreaInspectionFormValues;
    };

export type UnskipDraftAreaInspectionParseResult =
  | { ok: true; data: UnskipDraftAreaInspectionInput }
  | {
      ok: false;
      errors: AreaInspectionIdentityFieldErrors;
      values: AreaInspectionIdentityFormValues;
    };

export type AddOneOffAreaInspectionParseResult =
  | { ok: true; data: AddOneOffAreaInspectionInput }
  | {
      ok: false;
      errors: AddOneOffAreaInspectionFieldErrors;
      values: AddOneOffAreaInspectionFormValues;
    };

export type DraftInspectionIdentityParseResult<TInput> =
  | { ok: true; data: TInput }
  | {
      ok: false;
      errors: DraftInspectionIdentityFieldErrors;
      values: DraftInspectionIdentityFormValues;
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
  resultStatus: InspectionItemResultStatus | null;
  resultNote: string | null;
  beforePhotos: DraftInspectionItemEvidenceRecord[];
};

export type DraftInspectionItemEvidenceRecord = {
  id: string;
  inspectionItemId: string;
  evidenceType: "before_photo";
  storagePath: string;
  uploadedByAuthUserId: string;
  uploadedAt: Date;
};

export type DraftAreaInspectionRecord = {
  id: string;
  inspectionId: string;
  source: AreaInspectionSource;
  position: number;
  areaId: string;
  areaTypeId: string;
  inspectionTemplateId: string;
  areaNameSnapshot: string;
  areaTypeNameSnapshot: string;
  inspectionTemplateNameSnapshot: string;
  inspectionTemplateDescriptionSnapshot: string | null;
  isSkipped: boolean;
  skipReason: string | null;
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

export type DraftSubmissionValidation = {
  ok: boolean;
  errors: {
    inspection?: string;
    areaInspections?: Record<string, string[]>;
    items?: Record<string, string[]>;
  };
};

export type DraftSubmissionReviewAreaSummary = {
  id: string;
  areaName: string;
};

export type DraftSubmissionReviewCompletedAreaSummary =
  DraftSubmissionReviewAreaSummary & {
    source: AreaInspectionSource;
  };

export type DraftSubmissionReviewSkippedAreaSummary =
  DraftSubmissionReviewAreaSummary & {
    skipReason: string;
  };

export type DraftSubmissionReviewTicketSummary = {
  inspectionItemId: string;
  areaInspectionId: string;
  title: string;
};

export type DraftSubmissionReviewSummary = {
  completedAreaInspections: DraftSubmissionReviewCompletedAreaSummary[];
  skippedAreaInspections: DraftSubmissionReviewSkippedAreaSummary[];
  oneOffAreaInspections: DraftSubmissionReviewAreaSummary[];
  resultCounts: {
    pass: number;
    fail: number;
    notApplicable: number;
    unanswered: number;
  };
  ticketsToCreate: DraftSubmissionReviewTicketSummary[];
  hasSkippedPlannedAreaInspections: boolean;
  validation: DraftSubmissionValidation;
};

function trimFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validateDraftInspectionId(id: string): string | undefined {
  return isSetupRecordId(id) ? undefined : "Select a Draft Inspection.";
}

function validateAreaInspectionId(id: string): string | undefined {
  return isSetupRecordId(id) ? undefined : "Select an Area Inspection.";
}

function parseResultStatus(
  value: string,
): InspectionItemResultStatus | null | undefined {
  if (value === "") {
    return null;
  }

  return resultStatuses.has(value) ? (value as InspectionItemResultStatus) : undefined;
}

function noteLengthError(value: string): string | undefined {
  return value.length > MAX_RESULT_NOTE_LENGTH
    ? "Notes must be 1,000 characters or fewer."
    : undefined;
}

function addRecordError(
  records: Record<string, string[]> | undefined,
  id: string,
  message: string,
): Record<string, string[]> {
  const next = records ?? {};
  next[id] = [...(next[id] ?? []), message];
  return next;
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

export function parseSaveDraftInspectionItemResultFormData(
  formData: FormData,
): SaveDraftInspectionItemResultParseResult {
  const values = {
    inspectionId: trimFormValue(formData, "inspectionId"),
    itemId: trimFormValue(formData, "itemId"),
    resultStatus: trimFormValue(formData, "resultStatus"),
    resultNote: trimFormValue(formData, "resultNote"),
  };
  const errors: SaveDraftInspectionItemResultFieldErrors = {};
  const resultStatus = parseResultStatus(values.resultStatus);
  const inspectionIdError = validateDraftInspectionId(values.inspectionId);
  const noteError = noteLengthError(values.resultNote);

  if (inspectionIdError) {
    errors.inspectionId = inspectionIdError;
  }

  if (!isSetupRecordId(values.itemId)) {
    errors.itemId = "Select an inspection item.";
  }

  if (resultStatus === undefined) {
    errors.resultStatus = "Select Pass, Fail, Not Applicable, or Unanswered.";
  }

  if (noteError) {
    errors.resultNote = noteError;
  }

  if (Object.keys(errors).length > 0 || resultStatus === undefined) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: { ...values, resultStatus } };
}

export function parseSkipDraftAreaInspectionFormData(
  formData: FormData,
): SkipDraftAreaInspectionParseResult {
  const values = {
    inspectionId: trimFormValue(formData, "inspectionId"),
    areaInspectionId: trimFormValue(formData, "areaInspectionId"),
    skipReason: trimFormValue(formData, "skipReason"),
  };
  const errors: SkipDraftAreaInspectionFieldErrors = {};
  const inspectionIdError = validateDraftInspectionId(values.inspectionId);
  const areaInspectionIdError = validateAreaInspectionId(values.areaInspectionId);

  if (inspectionIdError) {
    errors.inspectionId = inspectionIdError;
  }

  if (areaInspectionIdError) {
    errors.areaInspectionId = areaInspectionIdError;
  }

  if (values.skipReason.length === 0) {
    errors.skipReason = "Enter a skip reason.";
  } else if (values.skipReason.length > MAX_RESULT_NOTE_LENGTH) {
    errors.skipReason = "Skip reason must be 1,000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

export function parseUnskipDraftAreaInspectionFormData(
  formData: FormData,
): UnskipDraftAreaInspectionParseResult {
  const values = {
    inspectionId: trimFormValue(formData, "inspectionId"),
    areaInspectionId: trimFormValue(formData, "areaInspectionId"),
  };
  const errors: AreaInspectionIdentityFieldErrors = {};
  const inspectionIdError = validateDraftInspectionId(values.inspectionId);
  const areaInspectionIdError = validateAreaInspectionId(values.areaInspectionId);

  if (inspectionIdError) {
    errors.inspectionId = inspectionIdError;
  }

  if (areaInspectionIdError) {
    errors.areaInspectionId = areaInspectionIdError;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

export function parseAddOneOffAreaInspectionFormData(
  formData: FormData,
): AddOneOffAreaInspectionParseResult {
  const values = {
    inspectionId: trimFormValue(formData, "inspectionId"),
    areaId: trimFormValue(formData, "areaId"),
    inspectionTemplateId: trimFormValue(formData, "inspectionTemplateId"),
  };
  const errors: AddOneOffAreaInspectionFieldErrors = {};
  const inspectionIdError = validateDraftInspectionId(values.inspectionId);

  if (inspectionIdError) {
    errors.inspectionId = inspectionIdError;
  }

  if (!isSetupRecordId(values.areaId)) {
    errors.areaId = "Select an Area.";
  }

  if (!isSetupRecordId(values.inspectionTemplateId)) {
    errors.inspectionTemplateId = "Select an Inspection Template.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  return { ok: true, data: values };
}

function parseDraftInspectionIdentity<TInput extends DraftInspectionIdentityFormValues>(
  formData: FormData,
): DraftInspectionIdentityParseResult<TInput> {
  const values = { inspectionId: trimFormValue(formData, "inspectionId") };
  const error = validateDraftInspectionId(values.inspectionId);

  if (error) {
    return { ok: false, errors: { inspectionId: error }, values };
  }

  return { ok: true, data: values as TInput };
}

export function parseSubmitDraftInspectionFormData(
  formData: FormData,
): DraftInspectionIdentityParseResult<SubmitDraftInspectionInput> {
  const result = parseDraftInspectionIdentity<Pick<SubmitDraftInspectionInput, "inspectionId">>(
    formData,
  );

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: {
      inspectionId: result.data.inspectionId,
      confirmSkippedPlannedAreas: formData.get("confirmSkippedPlannedAreas") === "on",
    },
  };
}

export function parseDiscardDraftInspectionFormData(
  formData: FormData,
): DraftInspectionIdentityParseResult<DiscardDraftInspectionInput> {
  return parseDraftInspectionIdentity<DiscardDraftInspectionInput>(formData);
}

export function validateDraftInspectionForSubmission(
  draft: DraftInspectionRecord,
): DraftSubmissionValidation {
  const errors: DraftSubmissionValidation["errors"] = {};
  const nonSkippedAreaInspections = draft.areaInspections.filter(
    (areaInspection) => !areaInspection.isSkipped,
  );

  if (nonSkippedAreaInspections.length === 0) {
    errors.inspection = "Submit at least one non-skipped Area Inspection.";
  }

  draft.areaInspections.forEach((areaInspection) => {
    if (areaInspection.isSkipped) {
      if (areaInspection.source !== "planned") {
        errors.areaInspections = addRecordError(
          errors.areaInspections,
          areaInspection.id,
          "Only planned Area Inspections can be skipped.",
        );
      }

      if (!areaInspection.skipReason?.trim()) {
        errors.areaInspections = addRecordError(
          errors.areaInspections,
          areaInspection.id,
          "Skipped Area Inspections require a reason.",
        );
      }

      return;
    }

    if (areaInspection.items.length === 0) {
      errors.areaInspections = addRecordError(
        errors.areaInspections,
        areaInspection.id,
        "Area Inspections need at least one item before submitting.",
      );
    }

    areaInspection.items.forEach((item) => {
      if (item.resultStatus === null) {
        errors.items = addRecordError(
          errors.items,
          item.id,
          "Answer this item before submitting.",
        );
      }

      if (item.resultStatus === "fail" && !item.resultNote?.trim()) {
        errors.items = addRecordError(
          errors.items,
          item.id,
          "Enter an issue note for failed items.",
        );
      }

      if (item.resultStatus === "fail" && item.beforePhotos.length === 0) {
        errors.items = addRecordError(
          errors.items,
          item.id,
          "Attach at least one Before Photo for failed items.",
        );
      }

      if (item.resultStatus !== "fail" && item.beforePhotos.length > 0) {
        errors.items = addRecordError(
          errors.items,
          item.id,
          "Before Photos are only allowed for failed items.",
        );
      }
    });
  });

  return { ok: Object.keys(errors).length === 0, errors };
}

export function summarizeDraftInspectionForSubmission(
  draft: DraftInspectionRecord,
): DraftSubmissionReviewSummary {
  const summary: DraftSubmissionReviewSummary = {
    completedAreaInspections: [],
    skippedAreaInspections: [],
    oneOffAreaInspections: [],
    resultCounts: { pass: 0, fail: 0, notApplicable: 0, unanswered: 0 },
    ticketsToCreate: [],
    hasSkippedPlannedAreaInspections: false,
    validation: validateDraftInspectionForSubmission(draft),
  };

  draft.areaInspections.forEach((areaInspection) => {
    const areaSummary = {
      id: areaInspection.id,
      areaName: areaInspection.areaNameSnapshot,
    };

    if (areaInspection.source === "one_off") {
      summary.oneOffAreaInspections.push(areaSummary);
    }

    if (areaInspection.isSkipped) {
      summary.skippedAreaInspections.push({
        ...areaSummary,
        skipReason: areaInspection.skipReason ?? "",
      });

      if (areaInspection.source === "planned") {
        summary.hasSkippedPlannedAreaInspections = true;
      }

      return;
    }

    const isCompletedAreaInspection =
      areaInspection.items.length > 0 &&
      areaInspection.items.every((item) => item.resultStatus !== null);

    if (isCompletedAreaInspection) {
      summary.completedAreaInspections.push({
        ...areaSummary,
        source: areaInspection.source,
      });
    }

    areaInspection.items.forEach((item) => {
      if (item.resultStatus === "pass") {
        summary.resultCounts.pass += 1;
      } else if (item.resultStatus === "fail") {
        summary.resultCounts.fail += 1;
        summary.ticketsToCreate.push({
          inspectionItemId: item.id,
          areaInspectionId: areaInspection.id,
          title: `${areaInspection.areaNameSnapshot} — ${item.itemNameSnapshot}`,
        });
      } else if (item.resultStatus === "not_applicable") {
        summary.resultCounts.notApplicable += 1;
      } else {
        summary.resultCounts.unanswered += 1;
      }
    });
  });

  return summary;
}

export function isReportableInspectionStatus(status: InspectionStatus): boolean {
  return status === "submitted";
}
