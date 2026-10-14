import { DateTime } from "luxon";

export interface TalkWindow {
  startUtc: string;
  endUtc: string;
}

function formatWindow(w: TalkWindow, zone: string): string {
  const start = DateTime.fromISO(w.startUtc, { zone: "utc" }).setZone(zone);
  const end = DateTime.fromISO(w.endUtc, { zone: "utc" }).setZone(zone);
  const dayLabel = start.hasSame(DateTime.now().setZone(zone), "day")
    ? "Today"
    : start.toFormat("ccc LLL d");
  return `${dayLabel}, ${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

export default function BestTimeToTalk({
  windows,
  viewerZone,
}: {
  windows: TalkWindow[];
  viewerZone: string;
}) {
  return (
    <div className="rounded-xl2 bg-paper shadow-cozy p-5">
      <div className="text-sm font-medium mb-3 flex items-center gap-1.5">
        <span>💬</span> Best times to talk
      </div>
      {windows.length === 0 ? (
        <p className="text-sm text-[#3A2E2A]/50">
          No shared awake, free windows found in the next few days — check each other&apos;s calendars.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {windows.map((w, i) => (
            <li
              key={i}
              className="text-sm bg-cream rounded-lg px-3 py-2 text-[#3A2E2A]/80"
            >
              {formatWindow(w, viewerZone)} <span className="text-[#3A2E2A]/40">(your time)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
