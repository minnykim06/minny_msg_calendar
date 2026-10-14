import { DateTime, Interval } from "luxon";
import type { DisplayName, EventRow } from "@/lib/types";

export const ZONES: Record<DisplayName, string> = {
  minny: "America/Los_Angeles",
  msg: "Asia/Seoul",
};

export const COLORS: Record<DisplayName, { solid: string; soft: string; text: string }> = {
  minny: { solid: "#5B8DD9", soft: "rgba(91,141,217,0.18)", text: "#9CC3F2" }, // San Diego blue
  msg: { solid: "#EC6A94", soft: "rgba(236,106,148,0.18)", text: "#F5A3C2" }, // Seoul pink
};

export const SLEEP_COLOR = { solid: "#6B5B95", soft: "rgba(107,91,149,0.35)", text: "#B9ACDA" };

export const OTHER: Record<DisplayName, DisplayName> = {
  minny: "msg",
  msg: "minny",
};

/** Hours person `a` is ahead of person `b` right now (signed), from real IANA offsets. */
export function offsetHoursBetween(zoneA: string, zoneB: string): number {
  const now = DateTime.utc();
  const offsetA = now.setZone(zoneA).offset; // minutes
  const offsetB = now.setZone(zoneB).offset;
  return Math.round((offsetA - offsetB) / 60);
}

export function formatSignedOffset(hours: number): string {
  return `${hours >= 0 ? "+" : ""}${hours}hrs`;
}

export function nowIn(zone: string): DateTime {
  return DateTime.now().setZone(zone);
}

export function formatClockTime(dt: DateTime): string {
  return dt.toFormat("h:mm a");
}

export function formatClockDate(dt: DateTime): string {
  return dt.toFormat("ccc, LLL d");
}

export function formatTimeRange(startUtc: string, endUtc: string, zone: string): string {
  const start = DateTime.fromISO(startUtc, { zone: "utc" }).setZone(zone);
  const end = DateTime.fromISO(endUtc, { zone: "utc" }).setZone(zone);
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

export function formatEventRange(startUtc: string, endUtc: string, zone: string): string {
  const start = DateTime.fromISO(startUtc, { zone: "utc" }).setZone(zone);
  const end = DateTime.fromISO(endUtc, { zone: "utc" }).setZone(zone);
  const sameDay = start.hasSame(end, "day");
  if (sameDay) {
    return `${start.toFormat("ccc LLL d, h:mm a")} – ${end.toFormat("h:mm a")}`;
  }
  return `${start.toFormat("ccc LLL d, h:mm a")} – ${end.toFormat("ccc LLL d, h:mm a")}`;
}

/** Convert a "YYYY-MM-DDTHH:mm" local datetime (entered in `zone`) to a UTC ISO string for storage. */
export function localInputToUtcIso(localDateTime: string, zone: string): string {
  return DateTime.fromISO(localDateTime, { zone }).toUTC().toISO()!;
}

/** Convert a stored UTC ISO string to a "YYYY-MM-DDTHH:mm" value for an <input type="datetime-local"> in `zone`. */
export function utcIsoToLocalInput(utcIso: string, zone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm");
}

interface StatusLabel {
  emoji: string;
  text: string;
}

/** A friendly, approximate "what are they probably doing" label from local hour alone. */
export function statusLabel(name: DisplayName, zone: string): StatusLabel {
  const dt = nowIn(zone);
  const hour = dt.hour + dt.minute / 60;
  const isWeekend = dt.weekday === 6 || dt.weekday === 7;

  if (hour >= 23 || hour < 6) {
    return { emoji: "😴", text: `${name} is asleep` };
  }
  if (hour < 9) {
    return { emoji: "🌅", text: `${name} is waking up` };
  }
  if (!isWeekend && hour < 18) {
    return { emoji: "💼", text: `${name} is probably busy` };
  }
  if (hour < 18) {
    return { emoji: "☀️", text: `${name} is off for the day` };
  }
  return { emoji: "🌙", text: `${name} is winding down` };
}

export interface CountdownParts {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/** Days/hours/min/sec remaining until local midnight of `targetDate` ("YYYY-MM-DD") in `viewerZone`. */
export function computeCountdown(targetDate: string, viewerZone: string): CountdownParts | null {
  if (!targetDate) return null;
  const target = DateTime.fromISO(targetDate, { zone: viewerZone }).startOf("day");
  const now = DateTime.now().setZone(viewerZone);
  const diff = target.diff(now, ["days", "hours", "minutes", "seconds"]);
  const totalSeconds = Math.round(target.diff(now, "seconds").seconds);
  const isPast = totalSeconds < 0;
  const abs = isPast ? now.diff(target, ["days", "hours", "minutes", "seconds"]) : diff;
  return {
    totalSeconds,
    days: Math.floor(Math.abs(abs.days ?? 0)),
    hours: Math.floor(Math.abs(abs.hours ?? 0)),
    minutes: Math.floor(Math.abs(abs.minutes ?? 0)),
    seconds: Math.floor(Math.abs(abs.seconds ?? 0)),
    isPast,
  };
}

export interface PersonScheduleInput {
  zone: string;
  awakeStartLocal: string; // "HH:MM:SS"
  awakeEndLocal: string; // "HH:MM:SS"
  events: EventRow[];
}

/**
 * Finds upcoming windows, over the next `horizonDays`, where both people are
 * awake (per their own settings) AND neither has a non-"Free" event booked.
 */
export function computeBestTimeToTalk(
  a: PersonScheduleInput,
  b: PersonScheduleInput,
  horizonDays = 3,
  maxResults = 6
): Interval[] {
  const now = DateTime.utc();
  const rangeEnd = now.plus({ days: horizonDays });

  const awakeIntervals = (person: PersonScheduleInput): Interval[] => {
    const [sh, sm] = person.awakeStartLocal.split(":").map(Number);
    const [eh, em] = person.awakeEndLocal.split(":").map(Number);
    const intervals: Interval[] = [];
    // walk local calendar days, one buffer day before the range to catch
    // windows that start before `now` in UTC but still extend past it.
    let cursor = now.setZone(person.zone).startOf("day").minus({ days: 1 });
    const localEnd = rangeEnd.setZone(person.zone);
    while (cursor <= localEnd) {
      const start = cursor.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
      const end = cursor.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
      if (end > start) {
        const interval = Interval.fromDateTimes(start.toUTC(), end.toUTC());
        const clipped = interval.intersection(Interval.fromDateTimes(now, rangeEnd));
        if (clipped) intervals.push(clipped);
      }
      cursor = cursor.plus({ days: 1 });
    }
    return intervals;
  };

  const busyIntervals = (person: PersonScheduleInput): Interval[] =>
    person.events
      .filter((e) => e.category !== "Free")
      .map((e) =>
        Interval.fromDateTimes(
          DateTime.fromISO(e.start_utc, { zone: "utc" }),
          DateTime.fromISO(e.end_utc, { zone: "utc" })
        )
      );

  const freeFor = (person: PersonScheduleInput): Interval[] => {
    const busy = busyIntervals(person);
    let free = awakeIntervals(person);
    for (const b of busy) {
      free = free.flatMap((f) => f.difference(b));
    }
    return free;
  };

  const freeA = freeFor(a);
  const freeB = freeFor(b);

  const overlaps: Interval[] = [];
  for (const ia of freeA) {
    for (const ib of freeB) {
      const inter = ia.intersection(ib);
      if (inter && inter.length("minutes") >= 1) overlaps.push(inter);
    }
  }

  overlaps.sort((x, y) => x.start!.toMillis() - y.start!.toMillis());
  return overlaps.slice(0, maxResults);
}
