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
more than one · Book a slot is a week calendar with tutor-availability
chips, not just a list (see below) · a parent with more than one child can
book one slot for one or both at once (see below) · a confirm-your-email
screen after sign-up when the Supabase project requires it (see below) ·
levels and streams are admin-managed reference data, not free text, and
gate fixed-class drop-in eligibility together with subject (see below).

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

**Tutor availability, and the Book a slot calendar.** `tutor_availability`
(a weekly recurring pattern per tutor) and `tutor_time_off` (one-off
exceptions on top of it — a day off, an appointment) are never read
directly by a family; both are admin- and owning-tutor-only in RLS. The
calendar only ever gets a count back, from `tutor_availability_grid()`, a
`SECURITY DEFINER` RPC that checks the weekly pattern minus time off minus
whatever that tutor is already assigned to (`sessions` joined to
`classes.tutor_id`) — one call for the whole visible week, not one round
trip per cell.

- Book a slot's hour band is a fixed centre-hours window — 9am–10pm on a
  weekend, noon–10pm on a weekday — not derived from whatever happens to
  be scheduled (an earlier version derived it from actual class/session
  times, which meant the window silently shrank or grew with the data).
  The grid always spans the wider 9am–10pm range; `cellFor` blanks the
  free/busy chip on weekday mornings, but an already-scheduled session
  there still renders regardless — the fixed window only limits what's
  *offered*, never hides something already booked.
- A cell with an existing bookable session (ad-hoc, or a fixed class with
  a spare seat) shows that session, clickable, same as before. A cell with
  no session but `tutors_free > 0` is a green chip — clicking it opens
  **Request a lesson** pre-filled with that date and hour; it still goes
  to admin for approval, same as the plain "Request a lesson" button.
  `tutors_free = 0` is a red, inert chip.
- Tutors manage their own pattern and time off from **My availability**
  (My teaching section for admins too, since an admin can be a class's
  tutor). No self-scheduling, no auto-assignment — this only ever changes
  what shows as green or red for a family to *propose*. A weekly pattern
  row can be edited in place (`avail-edit`), not just removed and
  re-added — `availabilityForm` takes an optional id the same way every
  other edit form in the app does. Defaults for a new row are 9am–10pm;
  a new class defaults to 3 seats.

**Booking for more than one child.** Browsing (which subjects/classes show
up, the calendar's hour band) stays scoped to whichever child's tab is
active — `studentTabs()`/`currentStudent()`, unchanged. But *booking* an
item now works out, per item, which of the parent's children could
actually take it, and lets the parent pick one or both:

- Ad-hoc slots have no subject restriction (`request_booking()` never
  checked one) — every child with a credit balance is offered.
- Fixed-class drop-ins do need a match — level, a subject that child
  already takes elsewhere, not already enrolled — checked per child via
  `eligibleFor()`, since siblings can easily differ on all three.
- A child who's already booked shows as a status pill instead of a
  checkbox; a child with a pending makeup for that slot gets it labelled
  and books via `redeem_makeup` instead of `request_booking` in the same
  batch — one "Book selected" click can mix both kinds of RPC call, one
  per selected child.
- Checkboxes carry no `data-act` (same lesson as the topic-toggle
  buttons — the global click handler's unconditional `preventDefault()`
  would fight a real checkbox's native toggle). They're read only when
  the "Book selected" button next to them is clicked, same pattern as
  the attendance selects and topic-grade inputs already use.
- With only one child, nothing changes — the original single button.
- **Request a lesson** (the custom-proposal form) got the same "For"
  checkbox list, since a proposal isn't gated by subject at all.

**Confirm-your-email screen after sign-up.** `db.auth.signUp()` returns a
`session` only when the project does *not* require email confirmation; when
confirmation is on, it comes back with a `user` but no `session`, and the
old code silently fell back to the plain sign-in screen with no explanation
of what just happened. `signUp()` now returns whether a session came back;
`do-signup` checks that instead of assuming success means "signed in" —
if there's no session it sets `state.pendingConfirmEmail` and renders
`renderConfirmPending()` (same `.gate`/`.gate-card` markup as the sign-in
screen) instead of calling `loadMe()`. "Back to sign in" just clears the
flag and returns to the normal auth screen. If the Supabase project ever
has confirmation switched off, `hasSession` is `true` and this screen never
shows — behaviour is unchanged for that config.

**Levels and streams as real reference data.** "Level" (Sec 3, P5, JC1 …)
used to be a free-text field typed the same way on classes, students and
topics — "Sec 3 G3" one place, "sec3 g3" another — and there was no
"stream" (G1/G2/G3, a centre's own grouping) field at all, just folded
into that same free text on classes only. An exact-string comparison
silently failing was how a spare seat in a same-subject class stopped
being offered to a family as a drop-in — the actual bug report that
prompted this.

- `levels` and `streams` are new admin-managed reference tables, each
  just a name and a sort order — a centre defines its own lists (a
  primary centre has no JC levels; streams are entirely a centre's own
  naming), managed from cards at the top of the **Topics** page,
  alongside subjects.
- `classes.level_id`/`stream_id`, `students.level_id` and
  `topics.level_id` replace the old free-text `level` columns, which are
  left in place unused rather than dropped. A class now requires both a
  level and a stream — enforced client-side in `classForm` — since a
  class always sits at exactly one of each.
- Drop-in eligibility for a fixed class with a spare seat
  (`bookableView`) now matches on subject *and stream* together
  (`subject_id + "_" + stream_id` as a set key), not subject alone — a
  student in G2 should not be offered a spare seat in a G3 class of the
  same subject just because both are "Additional Math." Level match is
  `level_id === level_id`, an exact reference-id comparison instead of a
  fragile string one.
- The same subject+stream+level check that gates the client UI is now
  also enforced inside `request_booking()` server-side — it previously
  only checked capacity, credits and "not already enrolled," so a family
  could have booked a mismatched drop-in by calling the RPC directly
  with an arbitrary session id. Closing that gap only became practical
  once level/stream were reliable ids instead of free text.
- `topics.level_id`/`stream_id` (nullable — null means "applies at every
  level"/"every stream") gate which topics a tutor can pick when grading
  a lesson: a subject alone doesn't say which topics are in scope, since
  the same subject differs by level and by stream at this centre.
  `attendanceSheet` fetches every topic under the class's subject, then
  filters to ones whose level/stream is unset or matches the class's —
  the actual wiring was missing before (the field existed but nothing
  read it), which is what surfaced this gap in the first place.
- Levels and streams reorder by dragging a row, not typing a number —
  `sort_order` is written straight from the row's position on drop.
  This needed a second delegated listener pattern (`dragstart`/
  `dragover`/`drop`/`dragend` on `document`, keyed off
  `[data-drag-list]`/`[data-drag-id]`) alongside the existing click
  delegation, since native drag events are a different event family.
  Topics kept the plain typed-in Order field instead — there are usually
  many more of them per subject than there are levels or streams, where
  typing a number beats dragging one row at a time.
- Subjects gained an edit button (`subjectForm` now takes an optional
  id) — it only ever supported adding before.

**Mobile pass.** The shell already had the groundwork (viewport meta,
an off-canvas sidebar drawer below 900px, `.grid-2`/`.grid-3` collapsing
to one column below 640px, tables scrolling horizontally in `.tbl-wrap`
rather than breaking layout). What was missing:

- Form inputs were 14.5px — under the 16px iOS Safari uses as the
  cutoff for auto-zooming a focused field. Every `input`/`select`/
  `textarea` is 16px now. Confirmed live with Playwright at a
  390×844 viewport: zero horizontal overflow, computed font-size 16px.
- The Book a slot week-grid keeps its 7-column shape even on a phone
  (collapsing to a single day loses the at-a-glance week, and it
  already sits in a horizontally-scrolling `.tbl-wrap`) but the minimum
  column width and card padding shrink below 640px so more of the week
  is visible before that scroll kicks in.
- A modal goes edge-to-edge (no radius, no margin, full height) below
  480px instead of floating a small card in a padded scrim — more
  usable width on a small phone. The close button's tap target grew
  (padding increased, offset with a matching negative margin so the
  visual size is unchanged).
- The invoice/receipt document (`showInvoiceDoc` — parents view this
  on-screen, not just at print time) had a fixed-width totals block and
  a two-column parties grid that could run tight or overflow under
  ~375px; both collapse below 480px. Its toolbar was inline-styled with
  no wrap behaviour, which could overflow on a narrow phone — pulled
  into a `.doc-bar` class with `flex-wrap` instead.
- Sidebar nav items get slightly taller padding while in mobile-drawer
  mode, for a better touch target.

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
- Both sides of a makeup can be undone, under the same `cancel_hours`
  notice either way. `withdraw_absence_report(report)` retracts a report
  before it's redeemed (deletes the row — "actually we can make it after
  all"); `cancel_booking()` on an already-redeemed makeup slot works the
  same as cancelling any other booking, and now also clears
  `absence_reports.redeemed_booking_id` back to null so the report can be
  redeemed again against a different slot. Before this fix, cancelling a
  makeup booking left the report permanently stuck "redeemed" against a
  cancelled booking, with no way to book a replacement makeup — the bug
  that prompted this. Once redeemed, `withdraw_absence_report` refuses
  (cancel the booking first) rather than pulling the report out from
  under an active booking.

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
