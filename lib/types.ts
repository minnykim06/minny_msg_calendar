export type DisplayName = "minny" | "msg";

export type Category = "Work" | "Class" | "Sleep" | "Free" | "Date Call";

export const CATEGORIES: Category[] = ["Work", "Class", "Sleep", "Free", "Date Call"];

export interface Profile {
  id: string;
  display_name: DisplayName;
  timezone: string;
  color: string;
  created_at: string;
}

export interface Settings {
  owner_id: string;
  awake_start_local: string; // "HH:MM:SS"
  awake_end_local: string; // "HH:MM:SS"
}

export interface EventRow {
  id: string;
  owner_id: string;
  title: string;
  start_utc: string; // ISO timestamptz
  end_utc: string; // ISO timestamptz
  note: string | null;
  category: Category;
  created_at: string;
}

export interface TripCountdown {
  id: number;
  target_date: string | null; // "YYYY-MM-DD"
  updated_by: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; display_name: DisplayName; timezone: string; color: string };
        Update: Partial<Profile>;
      };
      settings: {
        Row: Settings;
        Insert: Partial<Settings> & { owner_id: string };
        Update: Partial<Settings>;
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & {
          owner_id: string;
          title: string;
          start_utc: string;
          end_utc: string;
          category: Category;
        };
        Update: Partial<EventRow>;
      };
      trip_countdown: {
        Row: TripCountdown;
        Insert: Partial<TripCountdown>;
        Update: Partial<TripCountdown>;
      };
    };
  };
}
