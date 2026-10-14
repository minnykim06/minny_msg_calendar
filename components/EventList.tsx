import { DateTime } from "luxon";
import type { EventRow } from "@/lib/types";
import { formatEventRange } from "@/lib/time";

const CATEGORY_EMOJI: Record<string, string> = {
  Work: "💼",
  Class: "📚",
  Sleep: "😴",
  Free: "🌤️",
  "Date Call": "💌",
};

export default function EventList({
  events,
  zone,
  accentColor,
  editable,
  onEdit,
  onDelete,
}: {
  events: EventRow[];
  zone: string;
  accentColor: string;
  editable?: boolean;
  onEdit?: (event: EventRow) => void;
  onDelete?: (event: EventRow) => void;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-[#3A2E2A]/50 text-center py-6">Nothing scheduled.</p>;
  }

  const sorted = [...events].sort(
    (a, b) => DateTime.fromISO(a.start_utc).toMillis() - DateTime.fromISO(b.start_utc).toMillis()
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((event) => (
        <li
          key={event.id}
          className="rounded-xl2 bg-paper shadow-cozy p-3.5 flex items-start gap-3"
        >
          <span
            className="mt-0.5 w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{CATEGORY_EMOJI[event.category] ?? ""}</span>
              <span className="truncate">{event.title}</span>
            </div>
            <div className="text-xs text-[#3A2E2A]/55 mt-0.5">
              {formatEventRange(event.start_utc, event.end_utc, zone)}
            </div>
            {event.note && (
              <div className="text-xs text-[#3A2E2A]/70 mt-1">{event.note}</div>
            )}
          </div>
          {editable && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onEdit?.(event)}
                className="text-xs px-2 py-1 rounded-md hover:bg-black/5"
                aria-label="Edit"
              >
                ✎
              </button>
              <button
                onClick={() => onDelete?.(event)}
                className="text-xs px-2 py-1 rounded-md hover:bg-black/5"
                aria-label="Delete"
              >
                🗑
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
