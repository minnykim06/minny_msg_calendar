"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Settings, TripCountdown } from "@/lib/types";

function toTimeInput(t: string) {
  return t.slice(0, 5); // "08:00:00" -> "08:00"
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [me, setMe] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [partnerSettings, setPartnerSettings] = useState<Settings | null>(null);
  const [countdown, setCountdown] = useState<TripCountdown | null>(null);

  const [awakeStart, setAwakeStart] = useState("08:00");
  const [awakeEnd, setAwakeEnd] = useState("23:00");
  const [visitDate, setVisitDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

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

      const { data: settingsRows } = await supabase
        .from("settings")
        .select("*")
        .in("owner_id", [myProfile.id, partnerProfile.id]);
      const mine = settingsRows?.find((s) => s.owner_id === myProfile.id) ?? null;
      const theirs = settingsRows?.find((s) => s.owner_id === partnerProfile.id) ?? null;
      setPartnerSettings(theirs);
      if (mine) {
        setAwakeStart(toTimeInput(mine.awake_start_local));
        setAwakeEnd(toTimeInput(mine.awake_end_local));
      }

      const { data: trip } = await supabase.from("trip_countdown").select("*").eq("id", 1).single();
      setCountdown(trip ?? null);
      setVisitDate(trip?.target_date ?? "");

      setLoading(false);
    })();
  }, [supabase]);

  async function saveAwakeHours() {
    if (!me) return;
    setSavingHours(true);
    await supabase
      .from("settings")
      .upsert({ owner_id: me.id, awake_start_local: `${awakeStart}:00`, awake_end_local: `${awakeEnd}:00` });
    setSavingHours(false);
    setSavedMsg("Awake hours saved.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function saveVisitDate() {
    if (!me) return;
    setSavingVisit(true);
    await supabase
      .from("trip_countdown")
      .update({ target_date: visitDate || null, updated_by: me.id, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingVisit(false);
    setSavedMsg("Next visit date saved.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading || !me || !partner) {
    return <div className="pt-20 text-center text-sm text-[#3A2E2A]/50">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <section className="rounded-xl2 bg-paper shadow-cozy p-4 flex flex-col gap-3">
        <h2 className="text-sm font-medium">My awake hours</h2>
        <p className="text-xs text-[#3A2E2A]/50">
          Used for &quot;best time to talk&quot; — we won&apos;t suggest times outside this window.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#3A2E2A]/60">From</label>
            <input
              type="time"
              value={awakeStart}
              onChange={(e) => setAwakeStart(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#3A2E2A]/60">To</label>
            <input
              type="time"
              value={awakeEnd}
              onChange={(e) => setAwakeEnd(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={saveAwakeHours}
          disabled={savingHours}
          className="rounded-lg bg-minny text-white py-2 text-sm font-medium disabled:opacity-60"
        >
          {savingHours ? "Saving…" : "Save"}
        </button>
        {partnerSettings && (
          <p className="text-xs text-[#3A2E2A]/45">
            {partner.display_name}&apos;s awake hours: {toTimeInput(partnerSettings.awake_start_local)}–
            {toTimeInput(partnerSettings.awake_end_local)} ({partner.timezone.split("/")[1]?.replace("_", " ")} time)
          </p>
        )}
      </section>

      <section className="rounded-xl2 bg-paper shadow-cozy p-4 flex flex-col gap-3">
        <h2 className="text-sm font-medium">Next visit</h2>
        <p className="text-xs text-[#3A2E2A]/50">
          Shared between the two of you — either of you can update it.
        </p>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
        />
        <button
          onClick={saveVisitDate}
          disabled={savingVisit}
          className="rounded-lg bg-minny text-white py-2 text-sm font-medium disabled:opacity-60"
        >
          {savingVisit ? "Saving…" : "Save"}
        </button>
        {countdown?.updated_at && (
          <p className="text-xs text-[#3A2E2A]/40">
            Last updated {new Date(countdown.updated_at).toLocaleString()}
          </p>
        )}
      </section>

      {savedMsg && (
        <p className="text-center text-sm text-minny-text">{savedMsg}</p>
      )}

      <button
        onClick={handleSignOut}
        className="text-sm text-[#3A2E2A]/50 underline mt-2 self-center"
      >
        Sign out
      </button>
    </div>
  );
}
