import type { GlyphName } from "@/lib/ux/glyph";

export type NavItem = {
  href: string;
  title: string;
  description: string;
  hint?: string;
  icon: GlyphName;
  step?: number;
  phase: "setup-core" | "setup-extra" | "operate" | "admin";
};

export const setupNavItems: readonly NavItem[] = [
  {
    href: "/setup/clients",
    title: "Clients",
    description: "Create, edit, archive, and restore service customers.",
    hint: "Paying organizations you service",
    icon: "users",
    step: 1,
    phase: "setup-core",
  },
  {
    href: "/setup/buildings",
    title: "Buildings",
    description: "Manage service locations under active Clients.",
    hint: "Physical locations under each Client",
    icon: "building",
    step: 2,
    phase: "setup-core",
  },
  {
    href: "/setup/area-types",
    title: "Area Types",
    description: "Manage reusable Area categories used to organize Areas.",
    hint: "Categories like Restroom or Lobby",
    icon: "list",
    step: 3,
    phase: "setup-core",
  },
  {
    href: "/setup/areas",
    title: "Areas",
    description: "Manage inspectable spaces under active Buildings.",
    hint: "Restrooms, lobbies, and other spaces",
    icon: "search",
    step: 4,
    phase: "setup-core",
  },
  {
    href: "/setup/inspection-templates",
    title: "Inspection Templates",
    description: "Manage reusable inspection checklists and starter templates.",
    hint: "Reusable supervisor checklists",
    icon: "document",
    step: 5,
    phase: "setup-core",
  },
  {
    href: "/setup/building-inspection-plans",
    title: "Building Inspection Plans",
    description:
      "Assign active Areas and Inspection Templates used when starting future Draft Inspections.",
    hint: "Default checklist per Building",
    icon: "settings",
    step: 6,
    phase: "setup-core",
  },
  {
    href: "/company-branding",
    title: "Company Branding",
    description: "Configure the shared identity used by the app and future PDF reports.",
    icon: "shield",
    phase: "setup-extra",
  },
];

export const workspaceNavItems: readonly NavItem[] = [
  {
    href: "/inspections",
    title: "Inspections",
    description: "Browse submitted and draft building inspections.",
    icon: "check",
    phase: "operate",
  },
  {
    href: "/tickets",
    title: "Open Tickets",
    description: "Review corrective actions from failed inspection items.",
    icon: "ticket",
    phase: "operate",
  },
  {
    href: "/inspections/drafts",
    title: "Draft Inspections",
    description: "Continue in-progress inspections before submission.",
    icon: "draft",
    phase: "operate",
  },
];

export const adminNavItems: readonly NavItem[] = [
  {
    href: "/internal-users",
    title: "Internal Users",
    description: "Supervisor and manager accounts.",
    icon: "user",
    phase: "admin",
  },
];

export const setupCoreNavItems = setupNavItems.filter((item) => item.phase === "setup-core");
export const setupExtraNavItems = setupNavItems.filter((item) => item.phase === "setup-extra");
