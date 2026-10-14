import { createClient } from "@/lib/supabase/server";
import type { DisplayName, EventRow, Profile, Settings, TripCountdown } from "@/lib/types";

export interface ViewerContext {
  me: Profile;
  partner: Profile;
}

/** Loads the signed-in user's profile plus the other person's profile. Assumes exactly two accounts exist. */
export async function getViewerContext(): Promise<ViewerContext | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profiles } = await supabase.from("profiles").select("*");
  if (!profiles || profiles.length === 0) return null;

  const me = profiles.find((p) => p.id === auth.user!.id);
  const partner = profiles.find((p) => p.id !== auth.user!.id);
  if (!me || !partner) return null;

  return { me, partner };
}

export async function getSettingsFor(ownerIds: string[]): Promise<Record<string, Settings>> {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").in("owner_id", ownerIds);
  const map: Record<string, Settings> = {};
  for (const row of data ?? []) map[row.owner_id] = row;
  return map;
}

export async function getEventsFor(ownerId: string, fromUtc?: string, toUtc?: string): Promise<EventRow[]> {
  const supabase = createClient();
  let query = supabase.from("events").select("*").eq("owner_id", ownerId).order("start_utc");
  if (fromUtc) query = query.gte("end_utc", fromUtc);
  if (toUtc) query = query.lte("start_utc", toUtc);
  const { data } = await query;
  return data ?? [];
}

export async function getAllEventsInRange(fromUtc: string, toUtc: string): Promise<EventRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("end_utc", fromUtc)
    .lte("start_utc", toUtc)
    .order("start_utc");
  return data ?? [];
}

export async function getCountdown(): Promise<TripCountdown | null> {
  const supabase = createClient();
  const { data } = await supabase.from("trip_countdown").select("*").eq("id", 1).single();
  return data ?? null;
}

export function displayNameOf(profile: Profile): DisplayName {
  return profile.display_name;
}
