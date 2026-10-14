# minny ♡ msg

A tiny, private calendar for two people in two timezones — San Diego
(`America/Los_Angeles`) and Seoul (`Asia/Seoul`). Dual clocks, each person's
own calendar, a read-only view of your partner's schedule, a combined week
view, a "best time to talk" suggestion, and a countdown to your next visit.

Built with Next.js (App Router) + TypeScript + Tailwind CSS, Supabase
(Postgres + Auth + Realtime), and Luxon for DST-safe timezone math.

---

## 1. Prerequisites

- Node.js 18.18+ (or 20+)
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deploying later)

## 2. Install

```bash
npm install
```

## 3. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick any name/region/password (the DB password isn't used by the app directly).
3. Wait for the project to finish provisioning.

## 4. Create the database tables + security policies

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.

This creates `profiles`, `settings`, `events`, and `trip_countdown`, turns on
Row Level Security, and adds policies so that:
- both accounts can **read** each other's profile/settings/events (so you can
  see your partner's schedule), but
- each account can only **write** its own profile, settings, and events.

## 5. Turn off public sign-up

This app is for exactly two people — don't let the Email provider's sign-up
flow create extra accounts:

1. **Authentication → Providers → Email**.
2. Turn **off** "Allow new users to sign up" (wording may vary slightly by
   dashboard version — look for the sign-up toggle under Email auth settings).

## 6. Create the two accounts

1. **Authentication → Users → Add user** → create one for yourself (minny)
   and one for your girlfriend (msg), with email + password. Use "Auto
   Confirm User" so you don't need to click an email link.
2. Copy each user's **UUID** from the Users table (click into the user, or
   copy it from the table column).
3. Back in **SQL Editor**, run the following — once per account — replacing
   the UUID, timezone, and color:

```sql
-- minny (San Diego)
insert into profiles (id, display_name, timezone, color)
values ('PASTE-MINNYS-UUID-HERE', 'minny', 'America/Los_Angeles', '#E8846B');

insert into settings (owner_id, awake_start_local, awake_end_local)
values ('PASTE-MINNYS-UUID-HERE', '08:00', '23:00');

-- msg (Seoul)
insert into profiles (id, display_name, timezone, color)
values ('PASTE-MSGS-UUID-HERE', 'msg', 'Asia/Seoul', '#6E8FD1');

insert into settings (owner_id, awake_start_local, awake_end_local)
values ('PASTE-MSGS-UUID-HERE', '08:00', '23:00');
```

`display_name` **must** be exactly `minny` or `msg` — the UI and colors key
off of it.

## 7. Environment variables

1. In Supabase: **Settings → API** → copy the **Project URL** and the
   **anon public** key.
2. Copy the example env file and fill it in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 8. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with either
account, and you should see both your clocks. Add an event on
`/calendar/mine`, then check `/calendar` to see it show up for both of you
(try it from two different browser profiles/incognito windows signed in as
each person — changes sync live via Supabase Realtime).

## 9. Deploy to Vercel (free)

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the project's **Environment Variables**, add the same two variables
   from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel's free Hobby tier is plenty for a two-person app.
5. Add your two Supabase auth emails as the only people who ever log in —
   there's no sign-up page, so the deployed URL is safe to share only with
   each other.

---

## How the timezone math works

- Each person's IANA zone (`America/Los_Angeles` / `Asia/Seoul`) is stored on
  their `profiles` row — never a hardcoded UTC offset.
- Every event is converted from the creator's local time to UTC
  (`DateTime.fromISO(input, { zone }).toUTC()`, via [Luxon](https://moment.github.io/luxon/))
  before it's saved, and converted back to whichever zone the viewer wants to
  see on display.
- Because the conversion always goes through a real IANA zone, San Diego's
  daylight saving transitions (Seoul has none) are handled automatically —
  the displayed time difference will correctly flip between 16 and 17 hours
  around DST changes, with no manual offset to maintain.
- "Best time to talk" expands each person's awake-hours window (from
  **Settings**) into UTC intervals for the next few days, subtracts any
  events that aren't marked **Free**, and intersects the two people's free
  time.

## Project structure

```
app/
  login/              sign-in page
  page.tsx            home: dual clocks, countdown, best-time-to-talk
  calendar/           combined week view (with "my time"/"their time" toggle)
  calendar/mine/       your own calendar — add/edit/delete
  settings/            awake-hours window + next-visit date
lib/
  time.ts             all Luxon/timezone logic
  data.ts             server-side Supabase data loaders
  supabase/            browser/server/middleware Supabase clients
  types.ts             shared TypeScript types
components/            Clocks, Countdown, BestTimeToTalk, WeekView, EventForm, EventList, Nav
supabase/schema.sql    tables + RLS policies
```

## Notes

- There is intentionally no sign-up UI — accounts are provisioned once via
  the Supabase dashboard (step 6 above).
- If you ever need to change the next-visit date or awake hours, that's all
  on the **Settings** tab, and it's shared — either of you can update the
  visit date.
