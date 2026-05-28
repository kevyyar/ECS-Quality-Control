import { appConfig } from "@/lib/app-config";

const foundationItems = [
  "Next.js App Router scaffold",
  "TypeScript, lint, test, and build checks",
  "Supabase and Drizzle configuration placeholders",
  "Foundation only: no product workflows yet",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 px-6 py-12 text-ink sm:px-10">
      <section className="mx-auto flex max-w-4xl flex-col gap-8 rounded-card border border-slate-200 bg-white/90 p-8 shadow-sm sm:p-12">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            {appConfig.shortName}
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {appConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-ink">
              {appConfig.description}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2" aria-label="Scaffold status">
          {foundationItems.map((item) => (
            <div
              className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm font-medium text-brand-700"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
