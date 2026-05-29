"use client";

import { useActionState, useState } from "react";

import type { InspectionTemplateSetupRecord } from "@/lib/client-building-setup/model";

import {
  createInspectionTemplateAction,
  type InspectionTemplateSetupActionState,
  updateInspectionTemplateAction,
} from "./actions";

const initialState = { status: "idle" } satisfies InspectionTemplateSetupActionState;

type ItemRow = {
  key: string;
  name: string;
  description: string;
  sectionName: string;
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function blankItem(key = "new-item-0"): ItemRow {
  return { key, name: "", description: "", sectionName: "" };
}

function newClientItem(): ItemRow {
  return blankItem(`new-item-${Date.now()}-${Math.random()}`);
}


function templateToRows(template?: InspectionTemplateSetupRecord): ItemRow[] {
  if (!template || template.items.length === 0) {
    return [blankItem()];
  }

  return template.items
    .slice()
    .sort((first, second) => first.position - second.position)
    .map((item, index) => ({
      key: item.id || `template-item-${index}`,
      name: item.name,
      description: item.description ?? "",
      sectionName: item.sectionName ?? "",
    }));
}

function fieldValue(
  state: InspectionTemplateSetupActionState,
  field: "name" | "description",
  template?: InspectionTemplateSetupRecord,
): string {
  if (state.status === "error") {
    return state.values[field];
  }

  return template?.[field] ?? "";
}

function fieldError(
  state: InspectionTemplateSetupActionState,
  field: "name" | "description" | "items",
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

function itemError(
  state: InspectionTemplateSetupActionState,
  index: number,
  field: "name" | "description" | "sectionName",
): string | undefined {
  return state.status === "error" ? state.itemErrors[index]?.[field] : undefined;
}

function InspectionTemplateForm({
  formId,
  formAction,
  isPending,
  state,
  submitLabel,
  pendingLabel,
  template,
}: {
  formId: string;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  state: InspectionTemplateSetupActionState;
  submitLabel: string;
  pendingLabel: string;
  template?: InspectionTemplateSetupRecord;
}) {
  const [items, setItems] = useState(() => templateToRows(template));


  function updateItem(index: number, values: Partial<Omit<ItemRow, "key">>): void {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...values } : item,
      ),
    );
  }

  function removeItem(index: number): void {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function moveItem(index: number, direction: -1 | 1): void {
    setItems((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = current.slice();
      const [item] = next.splice(index, 1);

      if (!item) {
        return current;
      }

      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-slate-200 p-5">
      {template ? <input name="id" type="hidden" value={template.id} /> : null}

      <label className="space-y-2" htmlFor={`${formId}-name`}>
        <span className="text-sm font-semibold text-slate-900">Template name</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={fieldValue(state, "name", template)}
          id={`${formId}-name`}
          name="name"
          required
        />
        <FieldError message={fieldError(state, "name")} />
      </label>

      <label className="space-y-2" htmlFor={`${formId}-description`}>
        <span className="text-sm font-semibold text-slate-900">Description</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={fieldValue(state, "description", template)}
          id={`${formId}-description`}
          name="description"
        />
        <FieldError message={fieldError(state, "description")} />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Items</h2>
            <p className="text-sm text-muted-ink">
              Item order follows the order shown here. Section is optional.
            </p>
          </div>
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onClick={() => setItems((current) => [...current, newClientItem()])}
            type="button"
          >
            Add item
          </button>
        </div>
        <FieldError message={fieldError(state, "items")} />

        <div className="space-y-4">
          {items.map((item, index) => (
            <fieldset
              className="space-y-3 rounded-2xl border border-slate-200 p-4"
              key={item.key}
            >
              <div className="flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-slate-900">
                  Item {index + 1}
                </legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    type="button"
                  >
                    Up
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    type="button"
                  >
                    Down
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={items.length === 1}
                    onClick={() => removeItem(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <label className="space-y-2" htmlFor={`${formId}-item-name-${item.key}`}>
                <span className="text-sm font-semibold text-slate-900">Item name</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  id={`${formId}-item-name-${item.key}`}
                  name="itemName"
                  onChange={(event) => updateItem(index, { name: event.target.value })}
                  required
                  value={item.name}
                />
                <FieldError message={itemError(state, index, "name")} />
              </label>

              <label className="space-y-2" htmlFor={`${formId}-item-description-${item.key}`}>
                <span className="text-sm font-semibold text-slate-900">Item description</span>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  id={`${formId}-item-description-${item.key}`}
                  name="itemDescription"
                  onChange={(event) =>
                    updateItem(index, { description: event.target.value })
                  }
                  value={item.description}
                />
                <FieldError message={itemError(state, index, "description")} />
              </label>

              <label className="space-y-2" htmlFor={`${formId}-item-section-${item.key}`}>
                <span className="text-sm font-semibold text-slate-900">
                  Section name <span className="font-normal text-muted-ink">(optional)</span>
                </span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  id={`${formId}-item-section-${item.key}`}
                  name="itemSectionName"
                  onChange={(event) =>
                    updateItem(index, { sectionName: event.target.value })
                  }
                  value={item.sectionName}
                />
                <FieldError message={itemError(state, index, "sectionName")} />
              </label>
            </fieldset>
          ))}
        </div>
      </div>

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

export function InspectionTemplateCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createInspectionTemplateAction,
    initialState,
  );

  return (
    <InspectionTemplateForm
      formAction={formAction}
      formId="inspection-template-create"
      isPending={isPending}
      pendingLabel="Saving…"
      state={state}
      submitLabel="Create Inspection Template"
    />
  );
}

export function InspectionTemplateEditForm({
  template,
}: {
  template: InspectionTemplateSetupRecord;
}) {
  const [state, formAction, isPending] = useActionState(
    updateInspectionTemplateAction,
    initialState,
  );

  return (
    <InspectionTemplateForm
      formAction={formAction}
      formId={`inspection-template-${template.id}`}
      isPending={isPending}
      pendingLabel="Saving…"
      state={state}
      submitLabel="Save Inspection Template"
      template={template}
    />
  );
}
