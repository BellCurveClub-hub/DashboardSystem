# Bell Curve Club — Centre Portal

A tuition centre management system for a Singapore centre. One static
`index.html`, talking to Supabase. Deployed on GitHub Pages.

Four roles behind one login: **admin**, **tutor**, **parent**, **student**.

---

## Read this before changing anything

These are decisions already made and paid for. Do not revisit them without
being asked.

1. **Lesson credits never expire.** An expiry feature was built and then
   removed on purpose. Packages have no validity period. Invoices and the
   parent-facing package list both state that credits do not expire. Do not
   reintroduce it.
2. **Two balances, not one concept.** *Lesson credits* are bought in packages
   and spent by attending. *Reward points* are earned and spent on gifts. They
   are separate ledgers and must stay separate.
3. **Families never write to the tables that matter.** Booking, cancelling,
   handing in homework and approving results all go through
   `SECURITY DEFINER` RPCs. If you add a family-facing action that touches
   capacity, money, credits or scores, add an RPC — do not loosen RLS.
4. **School test results earn points only after an admin approves them,** and
   a photo of the report slip is required before approval. Points reverse if
   an approved result is later rejected.
5. **No secret ever reaches this file.** The Supabase anon key is public by
   design; RLS is the protection. The HitPay key and any email provider key
   live in Edge Function secrets only.
6. **Report slips are personal data about minors** — name, school, grades.
   Private bucket, signed URLs with a short expiry. Never a public URL, never
   a predictable path.
7. **The brand is Bell Curve Club, not T-Leng Tuition.** They are different
   businesses. T-Leng's navy/teal/gold worksheet house style does not apply
   here and must not leak in.

---

## Brand

Rejected early: navy and gold. It read as a bank, not a study club. Do not
drift back toward it.

| Role | Hex | Use |
|---|---|---|
| Ink slate | `#2E3A59` | structure, headings, sidebar |
| Ink deep | `#232C45` | sidebar base, body text |
| Highlighter | `#FFE45E` | fills and marks **only** — never text |
| Highlighter deep | `#9A7B00` | the readable counterpart on light |
| Coral | `#F2664B` | the peak dot, active nav, badges, bookable slots |
| Mint | `#2EC4B6` | primary actions, positive states |
| Lilac | `#8B7BE8` | avatars, spare accent |
| Paper | `#FBF8F1` | page wash (cards are white) |

Type: **Nunito** display (`--display`), **Inter** body (`--sans`), from Google
Fonts with a system fallback.

Wordmark: lowercase, highlighter swipe behind the last word — "bell curve
**club**".

Logo mark: generated, not traced. The Gaussian is evaluated in
`CURVE_OURS` / `CURVE_AVG` / `CURVE_FILL`; the club's curve sits right of the
cohort average, the area under it is filled like a marker pass, coral dot on
the peak. If you change the geometry, rasterise and look at it — including at
sidebar size — before committing.

Slogan: **"on the right side of the curve"**. Stored as the `tagline` setting,
not hardcoded. Shown under the wordmark when signed out and on invoices.

---

## Architecture

- **One file.** `index.html` contains the stylesheet, the app, the Postgres
  schema and the Edge Function source. The schema and function are shown in
  an admin-only Setup tab with copy buttons, so the repo stays a single
  uploadable file. Keep it that way unless asked.
- **No build step, no framework, no bundler.** Vanilla ES2020. Supabase JS
  from CDN.
- **Rendering** is string templates assigned to `innerHTML`. Every value that
  came from a user goes through `esc()`. No exceptions.
- **Events** are one delegated `click` listener. A control declares
  `data-act="thing"` and `ACTIONS.thing` handles it. Never attach inline
  handlers.
- **Data access** goes through the `sel` / `ins` / `upd` / `del` helpers.
- **No browser storage** except the Supabase connection details, and those are
  wrapped in try/catch with an in-memory fallback.

### Data model

`profiles` · `students` · `subjects` · `topics` · `classes` · `sessions` ·
`enrolments` · `bookings` · `attendance` · `packages` · `invoices` ·
`credit_ledger` · `points_ledger` · `rewards` · `redemptions` · `homework` ·
`topic_mastery` · `settings` · `grading_scales` · `grade_bands` ·
`exam_types` · `assessments`

Balances are derived: `students.credits` and `students.points` are maintained
by triggers on the two ledgers. Never write a balance directly — insert a
ledger row.

Key RPCs: `request_booking`, `cancel_booking`, `submit_homework`,
`decide_assessment`, `generate_sessions`.

Key guards: `is_admin()`, `is_tutor()`, `is_staff()`, `my_student_ids()`,
`my_taught_student_ids()`.

---

## Working on this

Run the smoke test after every change:

```bash
npm install      # once — pulls jsdom
npm test
```

It loads `index.html` in jsdom against a fake Supabase, renders every route
for all four roles, opens the main modals, and prints the invoice and receipt.
It must say **all green**. Run it with an empty database too:

```bash
npm run test:empty
```

A brand-new centre with no data is a real state and must not throw.

The test also enforces two structural rules, and so should you:

- every `data-act` in the markup has an entry in `ACTIONS`
- every route in `NAV` has a view function for that role

### Writing style in the interface

Plain, active, specific. Buttons say what happens: "Record payment", not
"Submit". An error explains what went wrong and what to do. An empty state
invites an action rather than apologising. Sentence case throughout. No
exclamation marks.

---

## Status

**Built:** auth and the four roles · classes and weekly timetable · session
generation · ad-hoc bookable slots and booking approval · attendance with
credit and point effects · students, enrolments and ledgers · packages,
invoices, manual payment recording, printable invoice/receipt · reward shelf
and redemption queue · homework assign/submit/grade · topic proficiency
scoring · test results (centre and school) with grading scales, approval
queue and report-slip storage · CSV exports · settings · makeup lessons for
absences (see below).

**Makeup lessons.** A missed fixed-class session never actually costs a
credit — the attendance trigger only charges on `present`/`late` — so a
makeup isn't a new balance or ledger, just a record that notice was given.

- A family reports an absence, ahead of time, for a session in one of the
  student's active fixed-class enrolments: `report_absence(session, student)`.
  It requires at least `cancel_hours` notice (the same setting `cancel_booking`
  already uses) and refuses ad-hoc sessions — those already have
  `cancel_booking`.
- `redeem_makeup(report, session)` is `request_booking()` plus a link back to
  the report, so both sides can see which open slot made up which missed
  lesson. It still requires a spare credit, same as any booking — the family
  already has one, since the missed lesson was never charged.
- `absence_reports` is a normal family-read / RPC-write table, same pattern as
  `bookings`.
- Parents see a "Report absence" button on upcoming fixed sessions
  (Schedule) and, once reported, the Book-a-slot buttons switch to "covers
  the missed lesson." Admins/tutors see an "absence reported" pill in the
  attendance register.
- Not built: any cap on how many makeups a student can bank, or an expiry —
  by design, they don't expire, same as credits.

**Next, in order:**

1. Term and holiday calendar — decided: a marked holiday blocks families from
   booking any slot on that date (including ad-hoc bookable ones), not just
   suppress auto-generation of recurring sessions.
2. Announcements to parents
3. Notification centre (in-app) and the email sender

**Deferred on purpose — do not build until asked:**

- **HitPay checkout.** The Edge Function is written and lives in the Setup
  tab. The `payments_online` setting hides the parent Pay-now button until it
  is deployed; parents see PayNow instructions instead.
- **Email sending.** Notifications are to be stored and shown in-app first;
  the sender follows the same deferred-function pattern.
