# Bell Curve Club — Centre Portal

A tuition centre management system for a Singapore centre. One static
`index.html`, talking to Supabase. Deployed on GitHub Pages.

Four roles behind one login: **admin**, **tutor**, **parent**, **student** —
plus **pending_tutor**, a holding state for a tutor sign-up nobody has
approved yet. It sees nothing but its own waiting screen.

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
absences (see below) · an Accounts admin page for changing anyone's role,
plus a focused Tutors page for approvals and who's teaching what · admins
can also be a class's tutor and get the matching "My teaching" views ·
tutor self sign-up gated behind admin approval (see below) · self-service
change email, change password and (pending SMS provider setup) phone
verification in My account · lesson reports from the register: topics
covered graded per student, a free-text summary, and inline homework (see
below) · Book a slot also surfaces fixed classes with a spare seat, not
just dedicated ad-hoc sessions (see below) · families can propose a custom
day/time nothing else covers, admin accepts and schedules it or declines
(see below) · Progress shows a tab per subject for a student tracked in
more than one.

**Lesson reports.** Folded into the existing "Mark the register" modal,
since that's already the after-lesson touchpoint — no separate screen.

- The tutor first picks which topics (from the class's subject) the
  lesson covered — toggle buttons, not a checkbox, since the global click
  handler unconditionally calls `preventDefault()` and would revert a real
  checkbox's native toggle right after; the same `aria-selected` pattern
  the invoice-status filter already uses, just multi-select. Only picked
  topics get a grading column; the grid regenerates in place
  (`renderTopicGrid`, stashed on `#modal-host.__renderTopicGrid` so the
  toggle handler can reach it) without touching attendance, summary or
  homework fields already filled in elsewhere in the same modal.
- Each grid cell is a 0–100 score. `lesson_topic_grades` is a new table,
  not an override: each save is one more sample `recompute_mastery()`
  averages over the last 8, same as graded homework and approved centre
  tests already do — a trend builds up lesson by lesson instead of one
  score replacing the last. Un-picking a topic that already had grades
  deletes them for that session.
- A free-text "what was covered" summary lives on `sessions.lesson_summary`.
- Homework can be assigned inline to everyone in the register in the same
  save, reusing the bulk-assign-to-class insert `homeworkForm` already does.
- All three are optional — leaving them blank behaves exactly as before.

**Drop-in booking for fixed classes.** `request_booking()` no longer only
honours `is_bookable` — a `fixed`-kind class with a spare seat (active
enrolments under its capacity) is bookable too, without needing a
permanent enrolment. Blocked if the student is already enrolled in that
class (nothing to drop into) or it's full. The confirm/waitlist capacity
check now counts enrolled students plus existing confirmed bookings
against the session's capacity, not bookings alone, since a fixed class's
real headcount is mostly enrolled students who never show up as bookings.
`bookableView` only offers this for a subject the student already takes
elsewhere, matching their level — browsing into a brand new subject this
way is out of scope for now.

**Custom lesson requests.** For a day and time nothing already covers —
there's no session to book into, so this is a separate proposal, not a
booking. `lesson_requests`: subject, a preferred date and time, an optional
note. A family inserts directly (RLS `p_ins`, no RPC — there's no
capacity/credit/stock rule to enforce at proposal time the way there is
for an actual booking). Reviewed on the same **Booking requests** page as
ordinary bookings, in its own "Custom lesson requests waiting" card.
Accepting (`scheduleLessonRequest`) does three things in one save: creates
the actual `sessions` row, confirms a `bookings` row for the student, and
marks the request `scheduled` with `session_id` set. Declining just marks
it `declined` — no session, no booking. `sessionForm` gained a real
`tutor_id` picker for this (it only ever had a free-text `tutor_name`
before) — allocating a tutor needs to be a real account link, or the
tutor would never see the lesson on their own dashboard.

**Progress subject tabs.** `progressBlock` (shared by admin and family
views) derives the tab list from `topic_mastery` itself — whichever
subjects a student actually has a tracked topic in, not every subject the
centre offers. Tabs are hidden entirely when a student only has one
subject, to avoid a pointless single tab. Switching tabs (`state.
progressSubject`) filters both the topic-by-topic bars and the recent
graded work table together, so "Average score" and "Topics tracked"
always describe the selected subject, not the student's whole record.

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

**Tutor sign-up.** The sign-up screen offers "A tutor" alongside parent and
student, but a tutor sign-up never lands as `tutor` directly.

- `fn_new_user()` maps a tutor sign-up to the `pending_tutor` role instead.
  `is_tutor()`/`is_staff()` only ever match the literal `'tutor'`, so a
  pending account is invisible to every student, schedule, attendance and
  homework policy — it only ever sees its own "awaiting approval" screen.
- An admin approves (or rejects back to parent) from **Accounts**, the same
  role-picker used for every other promotion — no separate queue or RPC.
  The Accounts nav badge counts pending sign-ups, same pattern as booking
  requests and redemptions.
- Admin accounts still can't be self-signed-up for — that hint stays on the
  sign-up form.

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
- **Twilio Trust Hub / Business Profile (SMS phone verification).** The app
  code and schema for phone verification are already built and live (My
  account → Mobile → send code/confirm code, `phone_verified` on
  `profiles`). It does nothing yet because no SMS provider is configured in
  Supabase — that needs Twilio's Business Profile/KYC approval (Trust Hub)
  for their compliant Singapore route, which the centre isn't paying to set
  up right now. Do not chase this further until asked.
