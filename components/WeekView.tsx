"use client";

import { DateTime } from "luxon";
import type { EventRow, Profile } from "@/lib/types";
import { COLORS, formatTimeRange } from "@/lib/time";

const CATEGORY_EMOJI: Record<string, string> = {
  Work: "💼",
  Class: "📚",
  Sleep: "😴",
  Free: "🌤️",
  "Date Call": "💌",
};

export default function WeekView({
  me,
  partner,
  events,
  viewZone,
  weekStart,
}: {
  me: Profile;
  partner: Profile;
  events: EventRow[];
  viewZone: string;
  weekStart: DateTime;
}) {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  const today = DateTime.now().setZone(viewZone).toISODate();

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => {
        const dayKey = day.toISODate();
        const dayEvents = events
          .filter((e) => DateTime.fromISO(e.start_utc, { zone: "utc" }).setZone(viewZone).toISODate() === dayKey)
          .sort((a, b) => DateTime.fromISO(a.start_utc).toMillis() - DateTime.fromISO(b.start_utc).toMillis());

        return (
          <div key={dayKey} className="rounded-xl2 bg-paper shadow-cozy p-3.5">
            <div
              className={`text-xs font-medium mb-2 ${
                dayKey === today ? "text-minny-text" : "text-[#3A2E2A]/50"
              }`}
            >
              {day.toFormat("ccc, LLL d")}
              {dayKey === today && <span className="ml-1.5">· today</span>}
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-xs text-[#3A2E2A]/35">—</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {dayEvents.map((event) => {
                  const owner = event.owner_id === me.id ? me : partner;
                  const color = COLORS[owner.display_name].solid;
                  return (
                    <li key={event.id} className="flex items-start gap-2 text-sm">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs">{CATEGORY_EMOJI[event.category] ?? ""}</span>
                          <span className="truncate font-medium">{event.title}</span>
                          <span className="text-[10px] text-[#3A2E2A]/40 shrink-0">
                            {owner.display_name}
                          </span>
                        </div>
                        <div className="text-xs text-[#3A2E2A]/50">
                          {formatTimeRange(event.start_utc, event.end_utc, viewZone)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
