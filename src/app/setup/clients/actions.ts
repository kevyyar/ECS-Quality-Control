"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseClientFormData,
  parseIdFormData,
  type ClientFieldErrors,
  type ClientFormValues,
} from "@/lib/client-building-setup/model";
import {
  archiveClient,
  createClient,
  isSetupRecordNotFoundError,
  restoreClient,
  updateClient,
} from "@/lib/client-building-setup/repository";

export type ClientSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: ClientFieldErrors;
      values: ClientFormValues;
    };

function revalidateClientSetupViews(clientId?: string): void {
  revalidatePath("/setup");
  revalidatePath("/setup/clients");
  revalidatePath("/setup/buildings");
  revalidatePath("/setup/areas");

  if (clientId) {
    revalidatePath(`/setup/clients/${clientId}`);
  }
}

function invalidClientIdState(): ClientSetupActionState {
  return {
    status: "error",
    errors: { name: "A valid Client is required." },
    values: { name: "" },
  };
}

export async function createClientAction(
  _previousState: ClientSetupActionState,
  formData: FormData,
): Promise<ClientSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseClientFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  const client = await createClient(result.data);
  revalidateClientSetupViews(client.id);

  return { status: "success", message: "Client saved." };
}

export async function updateClientAction(
  _previousState: ClientSetupActionState,
  formData: FormData,
): Promise<ClientSetupActionState> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return invalidClientIdState();
  }

  const result = parseClientFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  let client: Awaited<ReturnType<typeof updateClient>>;

  try {
    client = await updateClient(idResult.id, result.data);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return invalidClientIdState();
    }

    throw error;
  }

  revalidateClientSetupViews(client.id);

  return { status: "success", message: "Client saved." };
}

export async function archiveClientAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let client: Awaited<ReturnType<typeof archiveClient>>;

  try {
    client = await archiveClient(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateClientSetupViews(client.id);
}

export async function restoreClientAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let client: Awaited<ReturnType<typeof restoreClient>>;

  try {
    client = await restoreClient(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateClientSetupViews(client.id);
}
