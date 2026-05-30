import { revalidatePath } from "next/cache";

export function revalidateCorrectionNoteTarget(
  targetType: "submitted_inspection" | "ticket",
  targetId: string,
): void {
  if (targetType === "ticket") {
    revalidatePath("/tickets");
    revalidatePath(`/tickets/${targetId}`);
    revalidatePath(`/tickets/${targetId}/close`);
    revalidatePath("/dashboard");
    return;
  }

  revalidatePath(`/inspections/${targetId}`);
  revalidatePath("/dashboard");
}
