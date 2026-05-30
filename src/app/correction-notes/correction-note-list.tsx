import type { CorrectionNoteRecord } from "@/lib/correction-notes/model";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function CorrectionNoteList({
  notes,
}: {
  notes: CorrectionNoteRecord[];
}) {
  if (notes.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
        No Correction Notes have been added.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Correction Notes">
      {notes.map((note) => (
        <li className="rounded-2xl border border-slate-200 p-5" key={note.id}>
          <p className="whitespace-pre-wrap text-sm text-slate-800">{note.note}</p>
          <p className="mt-3 text-xs text-muted-ink">
            Added by {note.createdByEmail} · {formatDateTime(note.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
