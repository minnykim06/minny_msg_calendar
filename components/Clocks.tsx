"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import type { Profile } from "@/lib/types";
import {
  COLORS,
  formatClockDate,
  formatClockTime,
  formatSignedOffset,
  nowIn,
  offsetHoursBetween,
  statusLabel,
} from "@/lib/time";

const CITY_LABEL: Record<string, string> = {
  "America/Los_Angeles": "San Diego",
  "Asia/Seoul": "Seoul",
};

function ClockCard({ profile, otherZone }: { profile: Profile; otherZone: string }) {
  const [dt, setDt] = useState<DateTime>(() => nowIn(profile.timezone));

  useEffect(() => {
    const id = setInterval(() => setDt(nowIn(profile.timezone)), 1000);
    return () => clearInterval(id);
  }, [profile.timezone]);

  const colors = COLORS[profile.display_name];
  const status = statusLabel(profile.display_name, profile.timezone);
  const city = CITY_LABEL[profile.timezone] ?? profile.timezone;
  const offset = offsetHoursBetween(profile.timezone, otherZone);

  return (
    <div className="flex-1 rounded-xl2 bg-paper shadow-cozy p-4 border border-hairline">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">
          {profile.display_name} · {city}
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: colors.soft, color: colors.text }}
        >
          {formatSignedOffset(offset)}
        </span>
      </div>
      <div className="text-3xl font-semibold mt-1.5 tabular-nums" style={{ color: colors.text }}>
        {formatClockTime(dt)}
      </div>
      <div className="text-xs mt-0.5 text-foreground/45">{formatClockDate(dt)}</div>
      <div className="text-xs mt-2 flex items-center gap-1 text-foreground/70">
        <span>{status.emoji}</span>
        <span>{status.text}</span>
      </div>
    </div>
  );
}

export default function Clocks({ me, partner }: { me: Profile; partner: Profile }) {
  return (
    <div className="flex gap-3">
      <ClockCard profile={me} otherZone={partner.timezone} />
      <ClockCard profile={partner} otherZone={me.timezone} />
    </div>
  );
}
