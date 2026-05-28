export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-2xl rounded-card border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Supervisor capability required
        </h1>
        <p className="mt-3 text-muted-ink">
          Manager-only users can view allowed records and add Correction Notes,
          but this action requires Supervisor capability.
        </p>
      </section>
    </main>
  );
}
