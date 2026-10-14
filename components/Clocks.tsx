"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import type { Profile } from "@/lib/types";
import { COLORS, formatClockDate, formatClockTime, nowIn, statusLabel } from "@/lib/time";

const CITY_LABEL: Record<string, string> = {
  "America/Los_Angeles": "San Diego",
  "Asia/Seoul": "Seoul",
};

function ClockCard({ profile }: { profile: Profile }) {
  const [dt, setDt] = useState<DateTime>(() => nowIn(profile.timezone));

  useEffect(() => {
    const id = setInterval(() => setDt(nowIn(profile.timezone)), 1000);
    return () => clearInterval(id);
  }, [profile.timezone]);

  const colors = COLORS[profile.display_name];
  const status = statusLabel(profile.display_name, profile.timezone);
  const city = CITY_LABEL[profile.timezone] ?? profile.timezone;

  return (
    <div
      className="flex-1 rounded-xl2 p-4 shadow-cozy"
      style={{ backgroundColor: colors.soft }}
    >
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.text }}>
        {profile.display_name} · {city}
      </div>
      <div className="text-3xl font-semibold mt-1" style={{ color: colors.text }}>
        {formatClockTime(dt)}
      </div>
      <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.75 }}>
        {formatClockDate(dt)}
      </div>
      <div className="text-xs mt-2 flex items-center gap-1" style={{ color: colors.text }}>
        <span>{status.emoji}</span>
        <span>{status.text}</span>
      </div>
    </div>
  );
}

export default function Clocks({ me, partner }: { me: Profile; partner: Profile }) {
  return (
    <div className="flex gap-3">
      <ClockCard profile={me} />
      <ClockCard profile={partner} />
    </div>
  );
}
