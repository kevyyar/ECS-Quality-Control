export type UserCapability = "manager" | "supervisor";

export type CapabilityFlags = {
  manager: boolean;
  supervisor: boolean;
};

export type ProtectedAction =
  | "manageSetup"
  | "manageUsers"
  | "configureBranding"
  | "editDraftInspection"
  | "submitDraftInspection"
  | "viewActiveDraftMetadata"
  | "closeTicket"
  | "addCorrectionNote";

const protectedActionRequirements = {
  manageSetup: ["supervisor"],
  manageUsers: ["supervisor"],
  configureBranding: ["supervisor"],
  editDraftInspection: ["supervisor"],
  submitDraftInspection: ["supervisor"],
  viewActiveDraftMetadata: ["manager", "supervisor"],
  closeTicket: ["supervisor"],
  addCorrectionNote: ["manager", "supervisor"],
} satisfies Record<ProtectedAction, readonly UserCapability[]>;

export function normalizeCapabilities(flags: CapabilityFlags): UserCapability[] {
  const capabilities: UserCapability[] = [];

  if (flags.manager) {
    capabilities.push("manager");
  }

  if (flags.supervisor) {
    capabilities.push("supervisor");
  }

  return capabilities;
}

export function hasCapability(
  capabilities: readonly UserCapability[],
  capability: UserCapability,
): boolean {
  return capabilities.includes(capability);
}

export function canPerformProtectedAction(
  capabilities: readonly UserCapability[],
  action: ProtectedAction,
): boolean {
  return protectedActionRequirements[action].some((capability) =>
    hasCapability(capabilities, capability),
  );
}
