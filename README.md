# Event Registration

A fair, lottery-based event registration app for school events. Students sign up with their
school email, register interest in an event, and admins run a random draw once registration
closes — instead of a first-come-first-served scramble.

## How it works

- **Students** sign up with their school email and a password. Supabase emails a confirmation
  link before the account is active. Signed in, they browse open events and register — they
  can cancel anytime before the draw. Their result (selected / waitlisted / not selected) shows
  right on the event page once the draw has run.
- **Admins** (allow-listed by email in an env var) create events with a max capacity and a
  registration deadline. When ready, they click **Run Random Draw**, which randomly selects up
  to capacity from everyone registered and waitlists the rest. If a selected student later
  cancels, the admin can click **Promote Next From Waitlist** to pull in the next person in
  random order. Admins can also copy the email addresses for any outcome group (selected /
  waitlisted / not selected) to paste into their own email client and notify people manually —
  see "About notifications" below.

## Stack

Next.js 14 (App Router) · **Supabase** for both the database and email/password auth (no
separate ORM, no third-party OAuth provider to configure) · Tailwind, styled to a
monochrome/editorial design system · deployed on Vercel.

This app does not use Google Sign-In, and it does not send automated emails — both were cut
to avoid dependencies on school IT approval (for OAuth app registration) or a paid/third-party
email service. See below for what replaces each.

### About notifications

There's no automated email sending in this app — no SMTP setup, no email API, no cost. Instead:

- **Students** see their status directly on the event page (a clear "Selected" / "Waitlisted" /
  "Not selected" badge) as soon as the admin runs the draw.
- **Admins** can click a button on each event's admin page to copy a comma-separated list of
  emails for any outcome group, then paste it into the BCC field of a normal email in Gmail,
  Outlook, or whatever they already use, to send results manually if they want to.

If you later want automated email (e.g. via a free provider like Brevo, or your school's own
SMTP server), the code is structured so that's a small, isolated addition — ask and it's
straightforward to wire back in.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project. Save the
   database password it gives you somewhere safe.
2. Once it's provisioned, go to **Project Settings → API**. You'll need three values from here
   later: **Project URL**, the **anon public** key, and the **service_role** key (keep this last
   one secret — never expose it in any client-side code).

## 2. Set up the database schema

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click **New query**, paste in the entire contents of `supabase/schema.sql` from this project,
   and click **Run**.
3. This creates three tables (`profiles`, `events`, `registrations`), a trigger that
   auto-creates a profile the moment someone signs up, and baseline row-level security
   policies. You can verify it worked in the **Table Editor** tab.

## 3. Configure email auth in Supabase

1. Go to **Authentication → Providers → Email** and make sure it's enabled (it is by default).
   Confirm **"Confirm email"** is turned on, so students have to click a link in their inbox
   before their account is active — this also proves they actually own that email address.
   (This is Supabase's own auth email, sent automatically — separate from, and unaffected by,
   the "no automated email" decision above, which only applies to registration/draw
   notifications.)
2. Go to **Authentication → URL Configuration**. Set the **Site URL** to your app's URL (e.g.
   `https://your-app.vercel.app`, or `http://localhost:3000` while developing locally). Under
   **Redirect URLs**, add both:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback` (and the same domain with `/auth/reset-password`)
   These are the pages Supabase is allowed to send people back to after they click a
   confirmation or password-reset link.

**How the domain restriction works:** there's no Google Workspace setting involved at all.
When a student submits the sign-up form, `components/AuthForm.tsx` checks their email against
`NEXT_PUBLIC_SCHOOL_DOMAIN` *before* ever calling Supabase — so a non-school email is rejected
immediately, with a clear message, before an account or confirmation email is even created.

## 4. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=       # Project URL, from Supabase Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon public key, same page
SUPABASE_SERVICE_ROLE_KEY=      # service_role key, same page — keep this one secret
NEXT_PUBLIC_SCHOOL_DOMAIN=      # e.g. sciencespo.fr — only this domain can sign up
ADMIN_EMAILS=                   # comma-separated, e.g. [email protected],[email protected]
```

**How admin access works:** anyone whose email is in `ADMIN_EMAILS` is automatically granted the
`ADMIN` role the moment they sign in — no manual database edit needed. To add or remove an
admin, just update that env var and redeploy.

## 5. Install and run locally

```bash
npm install
npm run dev              # http://localhost:3000
```

## 6. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add all the environment variables from your `.env` in the Vercel project settings — mark
   `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive/Secret** since it's a credential.
4. Deploy.
5. Go back to Supabase's **Authentication → URL Configuration** and make sure your real
   production URL is in the Redirect URLs list (see step 3 above) — sign-up confirmation links
   won't work until it is.

There's no separate database migration step to run against production — steps 1–2 above already
created the tables directly in your one Supabase project, which both local dev and your
deployed app point at.

---

## Project structure

```
app/
  page.tsx                      Landing page (sign in/up form) / event list (signed in)
  events/[id]/page.tsx          Student-facing event detail + register/cancel
  admin/page.tsx                Admin dashboard: list of events
  admin/events/new/page.tsx     Create event form
  admin/events/[id]/page.tsx    Manage event: registrant list, run draw, promote, copy emails
  api/events/                   REST endpoints (list/create, get/edit/delete, register, draw, promote)
  auth/callback/route.ts        Where Supabase redirects after an email confirmation link
  auth/reset-password/page.tsx  Where students land from a password-reset email
lib/
  supabase/server.ts            Server-side Supabase client (reads the user's session)
  supabase/client.ts            Browser-side Supabase client (sign in / sign up / reset)
  supabase/admin.ts             Service-role client — bypasses RLS, used for all data access
                                 once our own code has already checked auth + role
  session.ts                    Reads the current user + syncs admin role from ADMIN_EMAILS
middleware.ts                   Refreshes the Supabase session on every request
supabase/schema.sql             Run this once in Supabase's SQL Editor to set up your database
components/
  AuthForm.tsx                  Sign in / sign up / forgot-password, with domain restriction
  EmailExport.tsx                Lets an admin copy emails by outcome for manual notification
  Nav.tsx, EventCard.tsx, RegisterButton.tsx, DrawControls.tsx, SignOutButton.tsx, ui/*
```

## Notes on the draw logic

The draw (`app/api/events/[id]/draw/route.ts`) uses a proper Fisher–Yates shuffle over everyone
with a `PENDING` registration, takes the first `maxAttendees` as `SELECTED`, and waitlists the
rest in that same randomized order — so waitlist position is fair too, not just the selection
itself. The draw can only be run once per event; promoting from the waitlist afterward always
takes the front of the (already-randomized) waitlist.

## A note on Row-Level Security

`supabase/schema.sql` sets up basic RLS policies (users can read their own profile/registrations,
anyone signed in can read events). In practice, all reads and writes in this app go through the
service-role client (`lib/supabase/admin.ts`), which bypasses RLS entirely — because every route
that uses it has already checked the user's identity and role in `lib/session.ts` first. The RLS
policies are there as a second line of defense in case anything ever queries Supabase directly
with a user's own browser session instead of going through your API routes.

## Things you may want to add later

- A "my registrations" page showing all events a student has signed up for in one place
- Automated email notifications (Brevo's free tier or a school SMTP relay both drop in cleanly)
- Bulk CSV export of registrants for an event
- Editing an event after creation (the PATCH endpoint already exists; there's just no UI form yet)
