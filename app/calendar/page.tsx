"use client";

import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/time";
import type { EventRow, Profile } from "@/lib/types";
import WeekView from "@/components/WeekView";

export default function CalendarPage() {
  const supabase = createClient();
  const [me, setMe] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMine, setViewMine] = useState(true);

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
    return <div className="pt-20 text-center text-sm text-[#3A2E2A]/50">Loading…</div>;
  }

  const viewZone = viewMine ? me.timezone : partner.timezone;
  const weekStart = DateTime.now().setZone(viewZone).startOf("week").plus({ weeks: weekOffset });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Together this week</h1>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.minny.solid }} />
            minny
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.msg.solid }} />
            msg
          </span>
        </div>

        <div className="flex rounded-full bg-black/5 p-0.5 text-xs">
          <button
            onClick={() => setViewMine(true)}
            className={`px-2.5 py-1 rounded-full ${viewMine ? "bg-paper shadow-sm font-medium" : "text-[#3A2E2A]/50"}`}
          >
            My time
          </button>
          <button
            onClick={() => setViewMine(false)}
            className={`px-2.5 py-1 rounded-full ${!viewMine ? "bg-paper shadow-sm font-medium" : "text-[#3A2E2A]/50"}`}
          >
            {partner.display_name}&apos;s time
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="px-2 py-1 text-[#3A2E2A]/60">
          ‹ Prev
        </button>
        <span className="text-xs text-[#3A2E2A]/50">
          {weekStart.toFormat("LLL d")} – {weekStart.plus({ days: 6 }).toFormat("LLL d")}
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="px-2 py-1 text-[#3A2E2A]/60">
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

      <WeekView me={me} partner={partner} events={events} viewZone={viewZone} weekStart={weekStart} />
    </div>
  );
}
