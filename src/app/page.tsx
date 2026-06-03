import Link from "next/link";

import { appConfig } from "@/lib/app-config";

const staticRoutes = [
  {
    path: "/",
    label: "Home",
    description: "Landing page with quick access to all available routes.",
  },
  {
    path: "/login",
    label: "Login",
    description: "Internal login for Supervisor and Manager users.",
  },
  {
    path: "/forbidden",
    label: "Forbidden",
    description: "Shows when a signed-in user lacks Supervisor capability.",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "Internal workspace dashboard showing user capabilities.",
  },
  {
    path: "/setup",
    label: "Setup",
    description: "Start point for managing core setup records.",
  },
  {
    path: "/setup/clients",
    label: "Clients",
    description: "Create, edit, archive, and restore service customers.",
  },
  {
    path: "/setup/buildings",
    label: "Buildings",
    description: "Manage service locations by Client.",
  },
  {
    path: "/setup/area-types",
    label: "Area Types",
    description: "Define reusable categories for inspectable spaces.",
  },
  {
    path: "/setup/areas",
    label: "Areas",
    description: "Manage inspectable spaces for active Buildings.",
  },
  {
    path: "/setup/inspection-templates",
    label: "Inspection Templates",
    description: "Build reusable inspection checklists for future plans.",
  },
  {
    path: "/setup/building-inspection-plans",
    label: "Building Inspection Plans",
    description: "Assign active Area/template pairs used by new drafts.",
  },
  {
    path: "/company-branding",
    label: "Company Branding",
    description: "Configure shared company identity and report defaults.",
  },
  {
    path: "/internal-users",
    label: "Internal Users",
    description: "Manage internal operator users and permissions.",
  },
  {
    path: "/inspections/drafts",
    label: "Draft Inspections",
    description: "Entry point for draft inspection workflows.",
  },
  {
    path: "/inspections",
    label: "Inspections",
    description: "Review Draft and Submitted Inspections.",
  },
  {
    path: "/tickets",
    label: "Open Tickets",
    description: "Review and close Tickets created from failed inspection items.",
  },
] as const;

const idBasedRoutes = [
  {
    path: "/setup/clients/[clientId]",
    label: "Client detail",
    description:
      "Detail/edit page for one client. Open by clicking View from /setup/clients.",
  },
  {
    path: "/setup/buildings/[buildingId]",
    label: "Building detail",
    description:
      "Detail/edit page for one building. Open by clicking View from /setup/buildings.",
  },
  {
    path: "/setup/area-types/[areaTypeId]",
    label: "Area Type detail",
    description:
      "Detail/edit page for one area type. Open by clicking View from /setup/area-types.",
  },
  {
    path: "/setup/areas/[areaId]",
    label: "Area detail",
    description: "Detail/edit page for one area. Open from /setup/areas or building views.",
  },
  {
    path: "/setup/inspection-templates/[id]",
    label: "Inspection Template detail",
    description:
      "Detail/edit page for one template. Open from /setup/inspection-templates.",
  },
  {
    path: "/setup/building-inspection-plans/[buildingId]",
    label: "Building Inspection Plan detail",
    description:
      "Configure inspection plan entries for one building. Open from plans list.",
  },
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">Routes</h2>

          <div className="grid gap-4 md:grid-cols-2" aria-label="Static routes">
            {staticRoutes.map((route) => (
              <Link
                href={route.path}
                key={route.path}
                className="block rounded-2xl border border-brand-100 bg-brand-50/70 p-4"
              >
                <span className="block text-sm font-semibold text-brand-700">
                  {route.path}
                </span>
                <span className="mt-2 block font-medium text-slate-900">
                  {route.label}
                </span>
                <p className="mt-2 text-sm text-brand-700">{route.description}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2" aria-label="ID-based routes">
            {idBasedRoutes.map((route) => (
              <div
                key={route.path}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                  ID-based route
                </span>
                <span className="mt-2 block text-sm font-semibold text-slate-900">
                  {route.path}
                </span>
                <span className="mt-1 block font-medium text-slate-700">
                  {route.label}
                </span>
                <p className="mt-2 text-sm text-slate-600">{route.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
