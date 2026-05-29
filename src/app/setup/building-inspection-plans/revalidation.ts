import { revalidatePath } from "next/cache";

export function revalidateBuildingInspectionPlanViews(buildingId?: string): void {
  revalidatePath("/setup");
  revalidatePath("/setup/building-inspection-plans");
  revalidatePath("/inspections/drafts");

  if (buildingId) {
    revalidatePath(`/setup/building-inspection-plans/${buildingId}`);
    revalidatePath(`/setup/buildings/${buildingId}`);
    return;
  }

  revalidatePath("/setup/building-inspection-plans/[buildingId]", "page");
  revalidatePath("/setup/buildings/[buildingId]", "page");
}
