"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/time";
import type { EventRow, Profile } from "@/lib/types";
import EventForm, { type EventFormValues } from "@/components/EventForm";
import EventList from "@/components/EventList";

export default function MyCalendarPage() {
  const supabase = createClient();
  const [me, setMe] = useState<Profile | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const loadEvents = useCallback(async (ownerId: string) => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("owner_id", ownerId)
      .order("start_utc");
    setEvents(data ?? []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (!profile) return;
      setMe(profile);
      await loadEvents(profile.id);
      setLoading(false);
    })();
  }, [supabase, loadEvents]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`events-mine-${me.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `owner_id=eq.${me.id}` },
        () => loadEvents(me.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, supabase, loadEvents]);

  async function handleCreate(values: EventFormValues) {
    if (!me) return;
    await supabase.from("events").insert({
      owner_id: me.id,
      title: values.title,
      start_utc: values.startUtc,
      end_utc: values.endUtc,
      note: values.note || null,
      category: values.category,
    });
    setShowForm(false);
    await loadEvents(me.id);
  }

  async function handleUpdate(values: EventFormValues) {
    if (!me || !editing) return;
    await supabase
      .from("events")
      .update({
        title: values.title,
        start_utc: values.startUtc,
        end_utc: values.endUtc,
        note: values.note || null,
        category: values.category,
      })
      .eq("id", editing.id);
    setEditing(null);
    await loadEvents(me.id);
  }

  async function handleDelete(event: EventRow) {
    if (!me) return;
    if (!confirm(`Delete "${event.title}"?`)) return;
    await supabase.from("events").delete().eq("id", event.id);
    await loadEvents(me.id);
  }

  if (loading || !me) {
    return <div className="pt-20 text-center text-sm text-[#3A2E2A]/50">Loading…</div>;
  }

  const accent = COLORS[me.display_name].solid;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My calendar</h1>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-white px-3.5 py-1.5 rounded-full"
            style={{ backgroundColor: accent }}
          >
            + Add
          </button>
        )}
      </div>

      {showForm && (
        <EventForm
          zone={me.timezone}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitLabel="Add event"
        />
      )}

      {editing && (
        <EventForm
          zone={me.timezone}
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
          submitLabel="Save changes"
        />
      )}

      {!showForm && !editing && (
        <EventList
          events={events}
          zone={me.timezone}
          accentColor={accent}
          editable
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
