import { revalidatePath } from "next/cache";

export function revalidateDraftInspectionViews(draftInspectionId?: string): void {
  revalidatePath("/inspections/drafts");
  revalidatePath("/dashboard");

  if (draftInspectionId) {
    revalidatePath(`/inspections/drafts/${draftInspectionId}`);
    return;
  }

  revalidatePath("/inspections/drafts/[inspectionId]", "page");
}
