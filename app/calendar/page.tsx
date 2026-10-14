"use client";

import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/client";
import { COLORS, SLEEP_COLOR } from "@/lib/time";
import type { DisplayName, EventRow, Profile } from "@/lib/types";
import Timetable from "@/components/Timetable";

const KOR_ZONE = "Asia/Seoul";

function startOfSundayWeek(dt: DateTime): DateTime {
  return dt.startOf("day").minus({ days: dt.weekday % 7 });
}

export default function CalendarPage() {
  const supabase = createClient();
  const [me, setMe] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [visible, setVisible] = useState<Record<DisplayName, boolean>>({ minny: true, msg: true });
  const [showSleep, setShowSleep] = useState(true);

  const loadEvents = useCallback(async (ids: string[]) => {
    const from = DateTime.utc().minus({ days: 10 }).toISO()!;
    const to = DateTime.utc().plus({ days: 24 }).toISO()!;
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("owner_id", ids)
      .gte("end_utc", from)
      .lte("start_utc", to)
      .order("start_utc");
    setEvents(data ?? []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles || profiles.length < 2) return;
      const myProfile = profiles.find((p) => p.id === auth.user!.id)!;
      const partnerProfile = profiles.find((p) => p.id !== auth.user!.id)!;
      setMe(myProfile);
      setPartner(partnerProfile);
      await loadEvents([myProfile.id, partnerProfile.id]);
      setLoading(false);
    })();
  }, [supabase, loadEvents]);

  useEffect(() => {
    if (!me || !partner) return;
    const channel = supabase
      .channel("events-combined")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () =>
        loadEvents([me.id, partner.id])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, partner, supabase, loadEvents]);

  if (loading || !me || !partner) {
    return <div className="pt-20 text-center text-sm text-foreground/50">Loading…</div>;
  }

  const weekStartKor = startOfSundayWeek(DateTime.now().setZone(KOR_ZONE)).plus({ weeks: weekOffset });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">KOR ⟷ SAN Timetable</h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={visible.minny}
            onChange={(e) => setVisible((v) => ({ ...v, minny: e.target.checked }))}
            className="accent-minny"
          />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.minny.solid }} />
          minny
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={visible.msg}
            onChange={(e) => setVisible((v) => ({ ...v, msg: e.target.checked }))}
            className="accent-msg"
          />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.msg.solid }} />
          msg
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showSleep}
            onChange={(e) => setShowSleep(e.target.checked)}
            className="accent-sleep"
          />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SLEEP_COLOR.solid }} />
          sleep
        </label>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="px-2 py-1 text-foreground/60">
          ‹ Prev
        </button>
        <span className="text-xs text-foreground/50">
          {weekStartKor.toFormat("LLL d")} – {weekStartKor.plus({ days: 6 }).toFormat("LLL d")} (KOR)
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="px-2 py-1 text-foreground/60">
          Next ›
        </button>
      </div>
      {weekOffset !== 0 && (
        <button
          onClick={() => setWeekOffset(0)}
          className="text-xs text-minny-text underline self-center -mt-2"
        >
          Back to this week
        </button>
      )}

      <Timetable
        me={me}
        partner={partner}
        events={events}
        weekStartKor={weekStartKor}
        visible={visible}
        showSleep={showSleep}
      />
    </div>
  );
}
