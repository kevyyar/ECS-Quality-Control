import { redirect } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";

export default async function SubmitDraftInspectionPage() {
  await requireProtectedAction("submitDraftInspection");

  redirect("/inspections/drafts");
}
