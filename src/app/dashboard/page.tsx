import { signOutInternalUser } from "@/lib/auth/actions";
import { requireInternalUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireInternalUser();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-6 rounded-card border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Internal workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="text-muted-ink">Signed in as {user.email}</p>
          </div>
          <form action={signOutInternalUser}>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <h2 className="font-semibold text-brand-800">Capabilities</h2>
          <p className="mt-2 text-sm text-brand-700">
            {user.capabilities.join(", ")}
          </p>
        </div>
      </section>
    </main>
  );
}
