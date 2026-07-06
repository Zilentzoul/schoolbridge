# SchoolBridge — Go-Live Guide

Everything you need to launch, start to finish. Budget ~20 minutes.
Payments are intentionally not included in this version.

---

## What you're deploying

A parent–school portal with three roles — **parent, teacher, admin** — where all
contact runs through the school (no personal phone numbers). It covers grades,
attendance, assignments, messages, announcements and a calendar, modeled on the
**Ghanaian school structure** (3 terms, Basic-level classes, continuous
assessment + exam scoring, house system).

Data lives in **Supabase** (free hosted Postgres) with **Row-Level Security**, so
a parent can only ever see their own ward's records. The frontend is React + Vite,
hosted on **Netlify**.

> Note: with no backend configured, the app runs in **demo mode** with sample
> data so you can preview the interface. Real login and saved data switch on the
> moment you add the two Supabase environment variables below.

---

## Step 1 — Create the Supabase project (5 min)

1. Go to supabase.com, sign up, and create a new project. Choose a region close
   to your users (e.g. an EU or nearest available region for Ghana). Save the
   database password somewhere safe.
2. When it's ready, open **Project Settings → API** and copy two values:
   - **Project URL**
   - **anon public** key

## Step 2 — Create the database (3 min)

1. In Supabase, open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates every table, the role system, and all security policies.
3. Optional: run `supabase/seed.sql` to load a starter class, subjects, terms,
   and sample announcements/events. (Read its comments first — you'll paste in
   your real user IDs where noted.)

## Step 3 — Create your first accounts (3 min)

You can either let staff self-register from the app's sign-up screen, or create
accounts yourself:

1. **Authentication → Users → Add user.** Create your admin account, e.g.
   `admin@yourschool.edu.gh`. Tick "Auto confirm user".
2. Do the same for a teacher and a parent if you want to test all three views.
3. Set each person's role: open **Table Editor → profiles** and set the `role`
   column to `admin`, `teacher`, or `parent`. (New sign-ups default to `parent`.)
4. To link a parent to their child, add a row in the **guardianships** table with
   that parent's `id` and the student's `id`.

## Step 4 — Deploy to Netlify (5 min)

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project** → select the repo.
   Build settings are read automatically from `netlify.toml`
   (build `npm run build`, publish `dist`).
3. Before the first deploy finishes, go to **Site settings → Environment
   variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` = your anon public key from Step 1
4. Trigger a redeploy (**Deploys → Trigger deploy**) so the variables take effect.

Your portal is now live. Visit the Netlify URL and sign in.

## Step 5 — Point your domain (optional)

In Netlify **Domain settings**, add your school domain (e.g.
`portal.yourschool.edu.gh`) and follow the DNS instructions. HTTPS is automatic.

---

## Day-to-day use

- **Admin** adds classes, subjects, students, terms, and links parents to wards;
  posts school-wide announcements and calendar events.
- **Teachers** enter grades and attendance, set assignments, and reply to parent
  messages within the system.
- **Parents** sign in, switch between their wards, follow performance, and message
  teachers by role — never by phone.

## Security notes

- The `anon` key is safe to expose in the browser; Row-Level Security enforces who
  can read what at the database level.
- Never put the Supabase **service_role** key in the frontend or in Netlify's
  build env — it bypasses all security. It isn't needed for this app.
- Consider turning on email confirmation and a password policy in
  Supabase → Authentication → Providers.

## Local development

```bash
cp .env.example .env      # fill in your two Supabase values
npm install
npm run dev
```
