"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type EventRow } from "@/lib/types";
import { localInputToUtcIso, utcIsoToLocalInput } from "@/lib/time";

export interface EventFormValues {
  title: string;
  startUtc: string;
  endUtc: string;
  note: string;
  category: Category;
}

export default function EventForm({
  zone,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  accentColor = "#D9A441",
}: {
  zone: string;
  initial?: EventRow;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  accentColor?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [start, setStart] = useState(
    initial ? utcIsoToLocalInput(initial.start_utc, zone) : ""
  );
  const [end, setEnd] = useState(initial ? utcIsoToLocalInput(initial.end_utc, zone) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "Free");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give it a title.");
    if (!start || !end) return setError("Pick a start and end time.");

    const startUtc = localInputToUtcIso(start, zone);
    const endUtc = localInputToUtcIso(end, zone);
    if (endUtc <= startUtc) return setError("End has to be after start.");

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), startUtc, endUtc, note: note.trim(), category });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-paper rounded-xl2 shadow-cozy p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-foreground/60">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-hairline px-3 py-2 bg-surfaceAlt text-sm"
          placeholder="e.g. Study group"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Start ({zone.split("/")[1]?.replace("_", " ")})</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-hairline px-3 py-2 bg-surfaceAlt text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">End</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-hairline px-3 py-2 bg-surfaceAlt text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-foreground/60">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="rounded-lg border border-hairline px-3 py-2 bg-surfaceAlt text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-foreground/60">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-lg border border-hairline px-3 py-2 bg-surfaceAlt text-sm resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: accentColor }}
          className="flex-1 rounded-lg text-white py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-hairline px-4 py-2.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
