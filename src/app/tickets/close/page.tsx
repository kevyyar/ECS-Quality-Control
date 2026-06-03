import { redirect } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";

export default async function CloseTicketIndexPage() {
  await requireProtectedAction("closeTicket");

  redirect("/tickets");
}
