import { revalidatePath } from "next/cache";

export function revalidateTicketViews(ticketId?: string): void {
  revalidatePath("/tickets");
  revalidatePath("/dashboard");

  if (ticketId) {
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}/close`);
  }
}
