import { describe, expect, it } from "vitest";

import {
  canPerformProtectedAction,
  hasCapability,
  normalizeCapabilities,
  type ProtectedAction,
  type UserCapability,
} from "./capabilities";

const supervisorOnlyActions = [
  "manageSetup",
  "manageUsers",
  "configureBranding",
  "editDraftInspection",
  "submitDraftInspection",
  "closeTicket",
] satisfies ProtectedAction[];

const allProtectedActions = [
  ...supervisorOnlyActions,
  "addCorrectionNote",
  "viewActiveDraftMetadata",
] satisfies ProtectedAction[];

describe("internal user capabilities", () => {
  it("represents Manager, Supervisor, and users with both capabilities", () => {
    expect(normalizeCapabilities({ manager: true, supervisor: false })).toEqual([
      "manager",
    ] satisfies UserCapability[]);

    expect(normalizeCapabilities({ manager: false, supervisor: true })).toEqual([
      "supervisor",
    ] satisfies UserCapability[]);

    expect(normalizeCapabilities({ manager: true, supervisor: true })).toEqual([
      "manager",
      "supervisor",
    ] satisfies UserCapability[]);
  });

  it("does not treat Manager as Supervisor", () => {
    const managerOnly = normalizeCapabilities({
      manager: true,
      supervisor: false,
    });

    expect(hasCapability(managerOnly, "manager")).toBe(true);
    expect(hasCapability(managerOnly, "supervisor")).toBe(false);
  });
});

describe("protected internal actions", () => {
  const policyMatrix = [
    {
      label: "users without capabilities",
      flags: { manager: false, supervisor: false },
      expected: {
        manageSetup: false,
        manageUsers: false,
        configureBranding: false,
        editDraftInspection: false,
        submitDraftInspection: false,
        closeTicket: false,
        addCorrectionNote: false,
        viewActiveDraftMetadata: false,
      },
    },
    {
      label: "Manager-only users",
      flags: { manager: true, supervisor: false },
      expected: {
        manageSetup: false,
        manageUsers: false,
        configureBranding: false,
        editDraftInspection: false,
        submitDraftInspection: false,
        closeTicket: false,
        addCorrectionNote: true,
        viewActiveDraftMetadata: true,
      },
    },
    {
      label: "Supervisor-only users",
      flags: { manager: false, supervisor: true },
      expected: {
        manageSetup: true,
        manageUsers: true,
        configureBranding: true,
        editDraftInspection: true,
        submitDraftInspection: true,
        closeTicket: true,
        addCorrectionNote: true,
        viewActiveDraftMetadata: true,
      },
    },
    {
      label: "Manager and Supervisor users",
      flags: { manager: true, supervisor: true },
      expected: {
        manageSetup: true,
        manageUsers: true,
        configureBranding: true,
        editDraftInspection: true,
        submitDraftInspection: true,
        closeTicket: true,
        addCorrectionNote: true,
        viewActiveDraftMetadata: true,
      },
    },
  ] satisfies {
    label: string;
    flags: Parameters<typeof normalizeCapabilities>[0];
    expected: Record<ProtectedAction, boolean>;
  }[];

  it.each(policyMatrix)("enforces the policy matrix for $label", ({ flags, expected }) => {
    const capabilities = normalizeCapabilities(flags);

    allProtectedActions.forEach((action) => {
      expect(canPerformProtectedAction(capabilities, action), action).toBe(
        expected[action],
      );
    });
  });
});
