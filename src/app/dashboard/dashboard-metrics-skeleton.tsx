export function DashboardMetricsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className="h-5 w-56 animate-pulse rounded-lg bg-slate-200/80" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-[132px] animate-pulse rounded-2xl border border-slate-200/70 bg-white"
            key={index}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200/70 bg-white lg:col-span-3" />
        <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200/70 bg-white lg:col-span-2" />
      </div>

      <div className="h-[280px] animate-pulse rounded-2xl border border-slate-200/70 bg-white" />
    </div>
  );
}
