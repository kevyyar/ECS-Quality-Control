import { requireProtectedAction } from "@/lib/auth/session";

export default async function CloseTicketPage() {
  await requireProtectedAction("closeTicket");

  return <h1>Ticket closure</h1>;
}
