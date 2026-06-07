"use client";

import { useActionState, useRef, useState } from "react";

import { ux } from "@/lib/ux/tokens";

import { closeTicketAction, type CloseTicketActionState } from "./actions";

const initialState = { status: "idle" } satisfies CloseTicketActionState;

type SelectedAfterPhoto = {
  id: string;
  file: File;
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function fieldError(
  state: CloseTicketActionState,
  field: "ticketId" | "resolutionNote" | "afterPhotos",
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

function resolutionNoteValue(state: CloseTicketActionState): string {
  return state.status === "error" ? state.values.resolutionNote : "";
}

function selectedPhotoId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function TicketClosureForm({ ticketId }: { ticketId: string }) {
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedAfterPhoto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formActionWithPhotos = async (
    previousState: CloseTicketActionState,
    formData: FormData,
  ) => {
    formData.delete("afterPhotos");
    selectedPhotos.forEach(({ file }) => formData.append("afterPhotos", file));

    return closeTicketAction(previousState, formData);
  };
  const [state, formAction, isPending] = useActionState(
    formActionWithPhotos,
    initialState,
  );
  const isClosed = state.status === "success";

  function addSelectedPhotos(files: FileList | null): void {
    if (!files || isClosed) {
      return;
    }

    setSelectedPhotos((current) => {
      const next = new Map(current.map((photo) => [photo.id, photo]));

      Array.from(files)
        .filter((file) => file.size > 0)
        .forEach((file) => {
          next.set(selectedPhotoId(file), { id: selectedPhotoId(file), file });
        });

      return [...next.values()];
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeSelectedPhoto(id: string): void {
    setSelectedPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  return (
    <form action={formAction} className={ux.formStack}>
      <input name="ticketId" type="hidden" value={ticketId} />
      <FieldError message={fieldError(state, "ticketId")} />

      <label className={ux.formField} htmlFor="resolution-note">
        <span className={ux.fieldLabel}>Resolution note</span>
        <textarea
          className={`${ux.textarea} min-h-28 disabled:cursor-not-allowed disabled:bg-slate-100`}
          defaultValue={resolutionNoteValue(state)}
          disabled={isClosed}
          id="resolution-note"
          maxLength={1000}
          name="resolutionNote"
          required
        />
        <FieldError message={fieldError(state, "resolutionNote")} />
      </label>

      <div className="grid gap-3">
        <label className={ux.formField} htmlFor="after-photos">
          <span className={ux.fieldLabel}>After Photos</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className={`${ux.fileInput} disabled:cursor-not-allowed disabled:bg-slate-100`}
            disabled={isClosed}
            id="after-photos"
            multiple
            onChange={(event) => addSelectedPhotos(event.currentTarget.files)}
            ref={inputRef}
            type="file"
          />
        </label>
        <FieldError message={fieldError(state, "afterPhotos")} />

        {selectedPhotos.length === 0 ? (
          <p className="text-sm text-muted-ink">No After Photos selected.</p>
        ) : (
          <ul aria-label="Selected After Photos" className="grid gap-2">
            {selectedPhotos.map((photo) => (
              <li
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm"
                key={photo.id}
              >
                <span className="truncate text-slate-700">{photo.file.name}</span>
                <button
                  className="text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isClosed || isPending}
                  onClick={() => removeSelectedPhoto(photo.id)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.status === "error" && state.formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.formError}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className={ux.successMessage}>
          {state.message}
        </p>
      ) : null}

      <div className={ux.formFooter}>
        <button
          className={ux.primaryButton}
          disabled={isPending || isClosed}
          type="submit"
        >
          {isPending ? "Closing…" : "Close Ticket"}
        </button>
      </div>
    </form>
  );
}
