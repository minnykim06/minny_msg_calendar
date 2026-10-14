import Link from "next/link";
import { DateTime } from "luxon";
import { getAllEventsInRange, getCountdown, getSettingsFor, getViewerContext } from "@/lib/data";
import { computeBestTimeToTalk } from "@/lib/time";
import Clocks from "@/components/Clocks";
import Countdown from "@/components/Countdown";
import BestTimeToTalk from "@/components/BestTimeToTalk";

export default async function HomePage() {
  const ctx = await getViewerContext();
  if (!ctx) {
    return (
      <div className="pt-20 text-center text-sm text-foreground/60">
        Couldn&apos;t load your profile. Make sure your account has a row in{" "}
        <code>profiles</code>.
      </div>
    );
  }
  const { me, partner } = ctx;

  const [settingsMap, countdown] = await Promise.all([
    getSettingsFor([me.id, partner.id]),
    getCountdown(),
  ]);

  const mySettings = settingsMap[me.id] ?? { owner_id: me.id, awake_start_local: "08:00:00", awake_end_local: "23:00:00" };
  const partnerSettings = settingsMap[partner.id] ?? { owner_id: partner.id, awake_start_local: "08:00:00", awake_end_local: "23:00:00" };

  const now = DateTime.utc();
  const horizonEnd = now.plus({ days: 3 }).toISO()!;
  const allEvents = await getAllEventsInRange(now.toISO()!, horizonEnd);
  const myEvents = allEvents.filter((e) => e.owner_id === me.id);
  const partnerEvents = allEvents.filter((e) => e.owner_id === partner.id);

  const windows = computeBestTimeToTalk(
    { zone: me.timezone, awakeStartLocal: mySettings.awake_start_local, awakeEndLocal: mySettings.awake_end_local, events: myEvents },
    { zone: partner.timezone, awakeStartLocal: partnerSettings.awake_start_local, awakeEndLocal: partnerSettings.awake_end_local, events: partnerEvents }
  ).map((w) => ({ startUtc: w.start!.toISO()!, endUtc: w.end!.toISO()! }));

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center pt-1 pb-1">
        <div className="text-3xl">🌙 ♡ ☀️</div>
      </div>

      <Clocks me={me} partner={partner} />

      <Countdown targetDate={countdown?.target_date ?? null} viewerZone={me.timezone} />

      <BestTimeToTalk windows={windows} viewerZone={me.timezone} />

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/calendar"
          className="rounded-xl2 bg-paper shadow-cozy p-4 text-sm font-medium text-center"
        >
          📅 This week, together
        </Link>
        <Link
          href="/calendar/mine"
          className="rounded-xl2 bg-paper shadow-cozy p-4 text-sm font-medium text-center"
        >
          ✏️ Add an event
        </Link>
      </div>
    </div>
  );
}
