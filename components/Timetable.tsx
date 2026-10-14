"use client";

import { DateTime } from "luxon";
import type { DisplayName, EventRow, Profile } from "@/lib/types";
import { COLORS, SLEEP_COLOR } from "@/lib/time";

const KOR_ZONE = "Asia/Seoul";
const SAN_ZONE = "America/Los_Angeles";

interface CellItem {
  id: string;
  title: string;
  color: string;
  isStart: boolean;
}

function dayRelation(korDate: DateTime, hour: number): "prev" | "same" {
  const instant = korDate.set({ hour, minute: 0, second: 0, millisecond: 0 });
  const sanDate = instant.setZone(SAN_ZONE);
  return sanDate.toISODate()! < korDate.toISODate()! ? "prev" : "same";
}

function sanHourLabel(korDate: DateTime, hour: number): string {
  const instant = korDate.set({ hour, minute: 0, second: 0, millisecond: 0 });
  return instant.setZone(SAN_ZONE).toFormat("h a");
}

export default function Timetable({
  me,
  partner,
  events,
  weekStartKor,
  visible,
  showSleep,
}: {
  me: Profile;
  partner: Profile;
  events: EventRow[];
  weekStartKor: DateTime;
  visible: Record<DisplayName, boolean>;
  showSleep: boolean;
}) {
  const todayKor = DateTime.now().setZone(KOR_ZONE).toISODate();
  const days = Array.from({ length: 7 }, (_, i) => weekStartKor.plus({ days: i }));

  const ownerDisplayName = (ownerId: string): DisplayName =>
    ownerId === me.id ? me.display_name : partner.display_name;

  function cellsForDay(day: DateTime): CellItem[][] {
    const rows: CellItem[][] = Array.from({ length: 24 }, () => []);
    for (const event of events) {
      const name = ownerDisplayName(event.owner_id);
      if (!visible[name]) continue;
      if (event.category === "Sleep" && !showSleep) continue;

      const startKor = DateTime.fromISO(event.start_utc, { zone: "utc" }).setZone(KOR_ZONE);
      const endKor = DateTime.fromISO(event.end_utc, { zone: "utc" }).setZone(KOR_ZONE);
      const dayStart = day.startOf("day");
      const dayEnd = day.endOf("day");
      if (endKor <= dayStart || startKor >= dayEnd) continue;

      const firstHour = startKor < dayStart ? 0 : startKor.hour;
      const lastHour = endKor > dayEnd ? 23 : Math.max(firstHour, endKor.hour - (endKor.minute === 0 ? 1 : 0));
      const color = event.category === "Sleep" ? SLEEP_COLOR.solid : COLORS[name].solid;

      for (let h = firstHour; h <= lastHour && h < 24; h++) {
        rows[h].push({
          id: event.id,
          title: event.title,
          color,
          isStart: h === firstHour,
        });
      }
    }
    return rows;
  }

  const columns = days.map((day) => ({ day, rows: cellsForDay(day) }));

  return (
    <div className="rounded-xl2 bg-paper shadow-cozy border border-hairline overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          {/* header */}
          <div className="grid grid-cols-[44px_52px_repeat(7,1fr)] sticky top-0 z-10 bg-surfaceAlt border-b border-hairline text-[10px]">
            <div className="px-1 py-2 text-center text-msg-text font-semibold">KOR</div>
            <div className="px-1 py-2 text-center text-minny-text font-semibold">SAN</div>
            {columns.map(({ day }) => {
              const isToday = day.toISODate() === todayKor;
              return (
                <div
                  key={day.toISODate()!}
                  className={`px-1 py-2 text-center font-medium ${
                    isToday ? "text-foreground bg-white/5" : "text-foreground/55"
                  }`}
                >
                  <div>{day.toFormat("ccc")}</div>
                  <div className="text-foreground/40">{day.toFormat("d")}</div>
                </div>
              );
            })}
          </div>

          {/* body */}
          {Array.from({ length: 24 }, (_, hour) => {
            const relation = dayRelation(weekStartKor, hour);
            return (
              <div
                key={hour}
                className="grid grid-cols-[44px_52px_repeat(7,1fr)] border-b border-hairline/60 last:border-b-0"
              >
                <div className="px-1 py-1 text-center text-[10px] text-msg-text/80 tabular-nums self-center">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="px-1 py-1 text-center self-center">
                  <div className="text-[10px] text-minny-text/80 tabular-nums">
                    {sanHourLabel(weekStartKor, hour)}
                  </div>
                  <div className="text-[8px] text-foreground/30 leading-none">
                    {relation === "prev" ? "prev day" : "same day"}
                  </div>
                </div>
                {columns.map(({ day, rows }) => {
                  const items = rows[hour];
                  return (
                    <div
                      key={day.toISODate()! + hour}
                      className="min-h-[26px] flex flex-col gap-px p-px"
                    >
                      {items.map((item, idx) => (
                        <div
                          key={item.id + idx}
                          className="flex-1 rounded-[3px] px-1 flex items-center overflow-hidden"
                          style={{ backgroundColor: item.color }}
                          title={item.title}
                        >
                          {item.isStart && (
                            <span className="text-[8px] text-white/90 font-medium truncate leading-none">
                              {item.title}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
