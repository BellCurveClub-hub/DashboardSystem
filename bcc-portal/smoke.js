/* Smoke test: loads index.html in jsdom against a fake Supabase and renders
   every route for every role. Run with EMPTY=1 to repeat it against a centre
   that has no data yet. Both modes must print "all green". */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const EMPTY = process.env.EMPTY === "1";
const PAGE = path.join(__dirname, "..", "index.html");

const D = () => {
  const d = new Date(); return d.toISOString().slice(0, 10);
};
const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const UID = { admin: "u-admin", tutor: "u-tutor", parent: "u-parent", student: "u-student" };

function fixtures() {
  return {
    profiles: [
      { id: UID.admin, role: "admin", full_name: "Centre Admin", email: "admin@x.sg", phone: "9111 1111", is_active: true },
      { id: UID.tutor, role: "tutor", full_name: "Mr Lim", email: "lim@x.sg", phone: "9333 3333", is_active: true },
      { id: UID.parent, role: "parent", full_name: "Mrs Tan", email: "tan@x.sg", phone: "9222 2222", is_active: true },
      { id: UID.student, role: "student", full_name: "Tan Wei Ling", email: "wl@x.sg", phone: null, is_active: true },
    ],
    students: [
      { id: "st1", profile_id: UID.student, parent_id: UID.parent, full_name: "Tan Wei Ling", level: "Sec 3 G3",
        school: "Bedok View", credits: 5, points: 340, low_credit_at: 2, notes: "", is_active: true },
      { id: "st2", profile_id: null, parent_id: UID.parent, full_name: "Tan Wei Jie", level: "Sec 1 G2",
        school: "Bedok View", credits: 1, points: 80, low_credit_at: 2, notes: "", is_active: true },
    ],
    subjects: [{ id: "sub1", name: "Mathematics", colour: "#12707F" }, { id: "sub2", name: "Science", colour: "#2F7D4F" }],
    topics: [
      { id: "tp1", subject_id: "sub1", level: "Sec 3 G3", name: "Quadratic equations", sort_order: 1 },
      { id: "tp2", subject_id: "sub1", level: "Sec 3 G3", name: "Trigonometry", sort_order: 2 },
    ],
    classes: [
      { id: "cl1", name: "Sec 3 G3 A-Math", subject_id: "sub1", level: "Sec 3 G3", tutor_name: "Mr Lim", room: "R1",
        kind: "fixed", day_of_week: new Date().getDay(), start_time: "16:00", end_time: "17:30", capacity: 8,
        credits_per_session: 1, is_active: true, tutor_id: UID.tutor },
      { id: "cl2", name: "Makeup slots", subject_id: "sub1", level: "Any", tutor_name: "Mr Lim", room: "R2",
        kind: "adhoc", day_of_week: null, start_time: null, end_time: null, capacity: 4,
        credits_per_session: 1, is_active: true, tutor_id: UID.tutor },
      { id: "cl3", name: "Someone else's class", subject_id: "sub2", level: "Sec 2", tutor_name: "Ms Ong", room: "R3",
        kind: "fixed", day_of_week: new Date().getDay(), start_time: "19:00", end_time: "20:30", capacity: 6,
        credits_per_session: 1, is_active: true, tutor_id: "u-other" },
    ],
    sessions: [
      { id: "se1", class_id: "cl1", session_date: D(), start_time: "16:00", end_time: "17:30", capacity: 8,
        status: "scheduled", is_bookable: false, tutor_name: "Mr Lim", room: "R1", notes: null },
      { id: "se2", class_id: "cl2", session_date: plus(3), start_time: "10:00", end_time: "11:30", capacity: 4,
        status: "scheduled", is_bookable: true, tutor_name: "Mr Lim", room: "R2", notes: "Makeup" },
      { id: "se3", class_id: "cl1", session_date: plus(-7), start_time: "16:00", end_time: "17:30", capacity: 8,
        status: "completed", is_bookable: false, tutor_name: "Mr Lim", room: "R1", notes: null },
      { id: "se4", class_id: "cl3", session_date: D(), start_time: "19:00", end_time: "20:30", capacity: 6,
        status: "scheduled", is_bookable: false, tutor_name: "Ms Ong", room: "R3", notes: null, tutor_id: "u-other" },
    ],
    enrolments: [{ id: "en1", student_id: "st1", class_id: "cl1", start_date: plus(-60), end_date: null, status: "active" }],
    bookings: [
      { id: "bk1", session_id: "se2", student_id: "st2", status: "requested", booked_by: UID.parent, note: "", created_at: new Date().toISOString() },
      { id: "bk2", session_id: "se2", student_id: "st1", status: "confirmed", booked_by: UID.parent, note: "", created_at: new Date().toISOString() },
    ],
    attendance: [{ id: "at1", session_id: "se3", student_id: "st1", status: "present", credits_charged: 1, marked_by: UID.admin, marked_at: new Date().toISOString() }],
    packages: [{ id: "pk1", name: "8-lesson Maths package", lessons: 8, price_cents: 48000, subject_id: "sub1", is_active: true }],
    invoices: [
      { id: "in1", invoice_no: "INV-2026-1000", student_id: "st1", parent_id: UID.parent, package_id: "pk1",
        description: "8-lesson Maths package", lessons: 8, amount_cents: 48000, status: "sent", issued_at: plus(-10),
        due_at: plus(-3), paid_at: null, payment_ref: null, hitpay_request_id: null, hitpay_url: null },
      { id: "in2", invoice_no: "INV-2026-1001", student_id: "st2", parent_id: UID.parent, package_id: "pk1",
        description: "8-lesson Maths package", lessons: 8, amount_cents: 48000, status: "paid", issued_at: plus(-40),
        due_at: plus(-33), paid_at: new Date().toISOString(), payment_ref: "x", hitpay_request_id: null, hitpay_url: "https://pay/x" },
    ],
    credit_ledger: [{ id: "cl_1", student_id: "st1", delta: 8, reason: "Package paid", ref_table: "invoices", ref_id: "in1", created_at: new Date().toISOString() }],
    points_ledger: [{ id: "pl1", student_id: "st1", delta: 10, reason: "Attended a lesson", ref_table: "attendance", ref_id: "at1", created_at: new Date().toISOString() }],
    rewards: [{ id: "rw1", name: "Bubble tea voucher", description: "$6", icon: "drink", points_cost: 300, stock: 5, is_active: true },
              { id: "rw2", name: "Free lesson credit", description: "One lesson", icon: "ticket", points_cost: 900, stock: 0, is_active: true }],
    redemptions: [{ id: "rd1", student_id: "st1", reward_id: "rw1", points_spent: 300, status: "pending", requested_at: new Date().toISOString(), note: null }],
    homework: [
      { id: "hw1", student_id: "st1", class_id: "cl1", topic_id: "tp1", title: "Ex 7.2 Q1-14", instructions: "Show working",
        assigned_at: plus(-5), due_at: plus(-1), status: "assigned", submitted_at: null, score: null, max_score: 100, feedback: null, graded_at: null },
      { id: "hw2", student_id: "st1", class_id: "cl1", topic_id: "tp2", title: "Trig worksheet", instructions: "",
        assigned_at: plus(-20), due_at: plus(-14), status: "graded", submitted_at: plus(-15), score: 72, max_score: 100, feedback: "Watch the exact values.", graded_at: plus(-13) },
      { id: "hw3", student_id: "st1", class_id: "cl1", topic_id: "tp1", title: "Revision set", instructions: "",
        assigned_at: plus(-3), due_at: plus(2), status: "submitted", submitted_at: new Date().toISOString(), score: null, max_score: 100, feedback: null, graded_at: null },
    ],
    topic_mastery: [
      { student_id: "st1", topic_id: "tp1", score: 88, samples: 3, manual_score: null, updated_at: new Date().toISOString() },
      { student_id: "st1", topic_id: "tp2", score: 61, samples: 2, manual_score: null, updated_at: new Date().toISOString() },
    ],
    grading_scales: [
      { id: "gs1", name: "O-Level / Express", note: "A1 to F9", sort_order: 1, is_active: true },
      { id: "gs2", name: "Percentage", note: "", sort_order: 5, is_active: true },
    ],
    grade_bands: [
      { id: "gb1", scale_id: "gs1", label: "A1", min_pct: 75, points: 60, sort_order: 0 },
      { id: "gb2", scale_id: "gs1", label: "B3", min_pct: 65, points: 45, sort_order: 2 },
      { id: "gb3", scale_id: "gs1", label: "C5", min_pct: 55, points: 30, sort_order: 4 },
      { id: "gb4", scale_id: "gs2", label: "Good", min_pct: 65, points: 36, sort_order: 2 },
    ],
    exam_types: [
      { id: "et1", name: "Mid-Year Exam", kind: "school", sort_order: 5, is_active: true },
      { id: "et2", name: "Preliminary Exam", kind: "school", sort_order: 9, is_active: true },
      { id: "et3", name: "Topical test", kind: "centre", sort_order: 1, is_active: true },
    ],
    assessments: [
      { id: "as1", student_id: "st1", kind: "school", subject_id: "sub1", topic_id: null, exam_type_id: "et1",
        scale_id: "gs1", title: "Paper 2", taken_on: plus(-120), score: 58, max_score: 100, grade_label: "C5",
        class_average: 61, class_position: 18, class_size: 34, slip_path: "st1/old.jpg", status: "approved",
        points_awarded: 30, band_points: 30, bonus_points: 0, submitted_by: UID.parent, approved_by: UID.admin,
        approved_at: new Date().toISOString(), notes: null, created_at: new Date().toISOString() },
      { id: "as2", student_id: "st1", kind: "school", subject_id: "sub1", topic_id: null, exam_type_id: "et2",
        scale_id: "gs1", title: "Paper 1", taken_on: plus(-20), score: 78, max_score: 100, grade_label: "A1",
        class_average: 64, class_position: 4, class_size: 34, slip_path: "st1/new.jpg", status: "approved",
        points_awarded: 90, band_points: 60, bonus_points: 30, submitted_by: UID.parent, approved_by: UID.admin,
        approved_at: new Date().toISOString(), notes: null, created_at: new Date().toISOString() },
      { id: "as3", student_id: "st2", kind: "school", subject_id: "sub2", topic_id: null, exam_type_id: "et1",
        scale_id: "gs2", title: "", taken_on: plus(-5), score: 70, max_score: 100, grade_label: null,
        class_average: null, class_position: null, class_size: null, slip_path: "st2/slip.jpg", status: "pending",
        points_awarded: 0, band_points: 0, bonus_points: 0, submitted_by: UID.parent, approved_by: null,
        approved_at: null, notes: null, created_at: new Date().toISOString() },
      { id: "as4", student_id: "st1", kind: "centre", subject_id: "sub1", topic_id: "tp2", exam_type_id: "et3",
        scale_id: "gs1", title: "Trig topical", taken_on: plus(-9), score: 42, max_score: 60, grade_label: "B3",
        class_average: null, class_position: null, class_size: null, slip_path: null, status: "approved",
        points_awarded: 45, band_points: 45, bonus_points: 0, submitted_by: UID.tutor, approved_by: UID.tutor,
        approved_at: new Date().toISOString(), notes: null, created_at: new Date().toISOString() },
    ],
    settings: [
      { key: "centre_name", value: { s: "Bell Curve Club" } },
      { key: "tagline", value: { s: "on the right side of the curve" } },
      { key: "cancel_hours", value: { n: 24 } },
      { key: "booking_auto_confirm", value: { n: 1 } },
      { key: "points_attendance", value: { n: 10 } },
      { key: "points_homework_ontime", value: { n: 8 } },
      { key: "points_homework_late", value: { n: 3 } },
      { key: "points_score_80", value: { n: 10 } },
      { key: "points_score_100", value: { n: 5 } },
      { key: "points_per_band_improved", value: { n: 15 } },
    ],
  };
}

function makeClient(DB, userId) {
  const user = { id: userId, email: (DB.profiles.find(p => p.id === userId) || {}).email };
  function query(table) {
    let rows = () => (DB[table] || []).slice();
    const filters = [];
    let head = false, wantCount = false, single = false, maybe = false, limit = null;
    const api = {
      select(_c, o) { if (o && o.head) head = true; if (o && o.count) wantCount = true; return api; },
      eq(c, v) { filters.push(r => String(r[c]) === String(v)); return api; },
      neq(c, v) { filters.push(r => String(r[c]) !== String(v)); return api; },
      in(c, vs) { filters.push(r => vs.map(String).includes(String(r[c]))); return api; },
      gte(c, v) { filters.push(r => r[c] >= v); return api; },
      lte(c, v) { filters.push(r => r[c] <= v); return api; },
      order() { return api; },
      limit(n) { limit = n; return api; },
      single() { single = true; return api; },
      maybeSingle() { maybe = true; return api; },
      insert(v) { const arr = Array.isArray(v) ? v : [v]; arr.forEach((r, i) => DB[table].push(Object.assign({ id: table + "_new" + i }, r))); return api; },
      update(patch) { filters.__patch = patch; return api; },
      upsert() { return api; },
      delete() { filters.__del = true; return api; },
      then(res) {
        let out = rows().filter(r => filters.every(f => f(r)));
        if (filters.__patch) out.forEach(r => Object.assign(r, filters.__patch));
        if (limit) out = out.slice(0, limit);
        if (head || wantCount) return res({ data: null, count: out.length, error: null });
        if (single || maybe) return res({ data: out[0] || null, error: out[0] || maybe ? null : { message: "no rows" } });
        return res({ data: out, error: null });
      },
    };
    return api;
  }
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
      resetPasswordForEmail: async () => ({}),
    },
    from: query,
    rpc: async () => ({ data: 4, error: null }),
    storage: {
      from: () => ({
        createSignedUrl: async p => ({ data: { signedUrl: "https://files.test/" + p }, error: null }),
        upload: async () => ({ data: { path: "x" }, error: null }),
      }),
    },
    functions: { invoke: async () => ({ data: { url: "https://pay/test" }, error: null }) },
  };
}

async function runRole(roleName, userId, empty) {
  const DB = fixtures();
  if (empty) Object.keys(DB).forEach(k => { if (k !== 'profiles' && k !== 'settings') DB[k] = []; });
  const html = fs.readFileSync(PAGE, "utf-8");
  const vc = new VirtualConsole();
  const errors = [];
  vc.on("jsdomError", e => errors.push("jsdomError: " + e.message));
  vc.on("error", (...a) => errors.push("console.error: " + a.map(String).join(" ")));

  const dom = new JSDOM(html, {
    runScripts: "dangerously", virtualConsole: vc, url: "https://example.test/",
    beforeParse(w) {
      w.supabase = { createClient: () => makeClient(DB, userId) };
      w.localStorage.setItem("sb_url", "https://fake.supabase.co");
      w.localStorage.setItem("sb_key", "anon-key");
      w.navigator.clipboard = { writeText: async () => {} };
    },
  });
  const w = dom.window;
  await new Promise(r => setTimeout(r, 350));

  const routes = w.eval("NAV")[roleName].filter(n => n.r).map(n => n.r);
  const results = [];
  for (const r of routes) {
    w.location.hash = "#/" + r;
    await w.eval("render()");
    await new Promise(res => setTimeout(res, 60));
    const view = w.document.querySelector("#view");
    const bad = view && view.querySelector(".note.bad");
    const txt = view ? view.textContent.trim() : "";
    results.push({
      route: r,
      ok: !bad && txt.length > 20,
      chars: txt.length,
      err: bad ? bad.textContent.slice(0, 160) : (txt.length <= 20 ? "view nearly empty" : ""),
    });
  }

  // exercise a few modals
  const modals = [];
  const tryClick = async sel => {
    const el = w.document.querySelector(sel);
    if (!el) return modals.push(sel + " -> button not found");
    el.click();
    await new Promise(res => setTimeout(res, 120));
    const m = w.document.querySelector(".modal");
    modals.push(sel + " -> " + (m ? "opened: " + (m.querySelector("h3") || {}).textContent : "NO MODAL"));
    const x = w.document.querySelector('[data-act="modal-close"]');
    if (x) x.click();
  };
  const checks = [];
  const check = (name, cond, extra) => checks.push((cond ? "  ok   " : "  FAIL ") + name + (extra ? " :: " + extra : ""));

  if (roleName === "admin" && !empty) {
    w.location.hash = "#/students"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="student-open"]');
    await tryClick('[data-act="student-edit"]');
    w.location.hash = "#/schedule"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="session-detail"]');
    await tryClick('[data-act="new-session"]');
    w.location.hash = "#/attendance"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="take-attendance"]');
    w.location.hash = "#/billing"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="new-invoice"]');
    w.location.hash = "#/homework"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="hw-edit"]');
    w.location.hash = "#/rewards"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="reward-edit"]');

    // --- new: money + admin tooling ---
    w.location.hash = "#/billing"; await w.eval("render()"); await new Promise(r => setTimeout(r, 60));
    await tryClick('[data-act="record-payment"]');

    w.document.querySelector('[data-act="print-invoice"]').click();
    await new Promise(r => setTimeout(r, 150));
    const doc = w.document.querySelector("#printdoc");
    check("invoice document renders", w.document.body.classList.contains("printing") && doc.textContent.length > 200,
      "chars=" + doc.textContent.length);
    check("invoice shows payment instructions or receipt",
      /How to pay|Payment received/.test(doc.textContent));
    check("invoice free of junk", !/undefined|NaN|\[object Object\]/.test(doc.textContent),
      (doc.textContent.match(/undefined|NaN|\[object Object\]/) || [""])[0]);
    // the paid invoice must come out as a receipt
    w.document.querySelector('[data-act="close-print"]').click();
    await new Promise(r => setTimeout(r, 40));
    const paidBtns = Array.from(w.document.querySelectorAll('[data-act="print-invoice"]'));
    paidBtns[paidBtns.length - 1].click();
    await new Promise(r => setTimeout(r, 150));
    const rec = w.document.querySelector("#printdoc").textContent;
    check("paid invoice prints as a receipt", /Receipt/.test(rec) && /Payment received/.test(rec));
    check("receipt free of junk", !/undefined|NaN|\[object Object\]/.test(rec));
    w.document.querySelector('[data-act="close-print"]').click();
    await new Promise(r => setTimeout(r, 60));
    check("print view closes", !w.document.body.classList.contains("printing"));

    w.document.querySelector('[data-act="inv-filter"][data-v="paid"]').click();
    await new Promise(r => setTimeout(r, 120));
    check("paid filter narrows the list",
      w.document.querySelectorAll("#view tbody tr").length === 1,
      "rows=" + w.document.querySelectorAll("#view tbody tr").length);

    w.eval('state.invFilter = "all"');
    w.location.hash = "#/students"; await w.eval("render()"); await new Promise(r => setTimeout(r, 80));
    w.document.querySelector("#f_stusearch").value = "wei jie";
    w.document.querySelector('[data-act="student-search"]').click();
    await new Promise(r => setTimeout(r, 140));
    check("student search filters",
      w.document.querySelectorAll("#view tbody tr").length === 1,
      "rows=" + w.document.querySelectorAll("#view tbody tr").length);

    w.eval('state.studentSearch = ""');
    w.location.hash = "#/progress"; await w.eval("render()"); await new Promise(r => setTimeout(r, 100));
    await tryClick('[data-act="mastery-set"]');

    let exported = true;
    try { await w.eval("exportInvoices()"); await new Promise(r => setTimeout(r, 120)); }
    catch (e) { exported = false; }
    check("CSV export runs", exported);
  }
  if (roleName === "tutor" && !empty) {
    w.location.hash = "#/students"; await w.eval("render()"); await new Promise(r => setTimeout(r, 80));
    await tryClick('[data-act="tutor-student"]');
    w.location.hash = "#/assessments"; await w.eval("render()"); await new Promise(r => setTimeout(r, 80));
    await tryClick('[data-act="assess-new"]');
    check("tutor nav has no money or admin pages",
      !w.eval("NAV.tutor").some(n => ["billing", "packages", "settings", "setup", "scales", "redemptions"].includes(n.r)));
    w.location.hash = "#/schedule"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    const stxt = w.document.querySelector("#view").textContent;
    check("tutor schedule hides another tutor's class",
      !/Someone else/.test(stxt) && /Sec 3 G3 A-Math/.test(stxt), stxt.slice(0, 100));
    w.location.hash = "#/attendance"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    check("tutor register hides another tutor's lesson",
      !/Someone else/.test(w.document.querySelector("#view").textContent));
  }
  if (roleName === "admin" && !empty) {
    w.location.hash = "#/assessments"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    const atxt = w.document.querySelector("#view").textContent;
    check("admin sees the approval queue", /Waiting for you \(1\)/.test(atxt), atxt.slice(0, 80));
    check("improvement bonus is shown", /\+30 up|\+90/.test(atxt), atxt.slice(0, 120));
    await tryClick('[data-act="assess-edit"]');
    w.location.hash = "#/scales"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    check("grading scales render", /A1/.test(w.document.querySelector("#view").textContent));
    await tryClick('[data-act="band-edit"]');
    await tryClick('[data-act="etype-edit"]');
    w.location.hash = "#/schedule"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    check("admin still sees every class",
      /Someone else/.test(w.document.querySelector("#view").textContent));
  }
  if (roleName === "parent" && !empty) {
    w.location.hash = "#/billing"; await w.eval("render()"); await new Promise(r => setTimeout(r, 80));
    const p = w.document.querySelector('[data-act="print-invoice"]');
    check("parent can open the invoice", !!p);
    check("parent sees PayNow guidance while the gateway is off",
      /How to pay/.test(w.document.querySelector("#view").textContent));
    check("no Pay now button while the gateway is off",
      !w.document.querySelector('[data-act="pay"]'));
    if (p) { p.click(); await new Promise(r => setTimeout(r, 150));
      check("parent invoice document renders", w.document.querySelector("#printdoc").textContent.length > 200);
      w.document.querySelector('[data-act="close-print"]').click(); }
    w.location.hash = "#/results"; await w.eval("render()"); await new Promise(r => setTimeout(r, 100));
    const rtxt = w.document.querySelector("#view").textContent;
    check("parent sees the results history", /Every result/.test(rtxt));
    check("trend chart drawn", !!w.document.querySelector("#view svg"));
    await tryClick('[data-act="assess-new"]');
    w.location.hash = "#/billing"; await w.eval("render()"); await new Promise(r => setTimeout(r, 90));
    const pb = w.document.querySelector('[data-act="print-invoice"]');
    check("invoice button present for the slogan check", !!pb);
    if (pb) {
      pb.click(); await new Promise(r => setTimeout(r, 150));
      check("slogan appears on the invoice",
        /on the right side of the curve/.test(w.document.querySelector("#printdoc").textContent));
      w.document.querySelector('[data-act="close-print"]').click();
    }
  }
  dom.window.close();
  return { results, errors, modals, checks };
}

async function runGate() {
  const DB = fixtures();
  const html = fs.readFileSync(PAGE, "utf-8");
  const vc = new VirtualConsole();
  const dom = new JSDOM(html, {
    runScripts: "dangerously", virtualConsole: vc, url: "https://example.test/",
    beforeParse(w) {
      const c = makeClient(DB, UID.parent);
      c.auth.getUser = async () => ({ data: { user: null } });
      w.supabase = { createClient: () => c };
      w.localStorage.setItem("sb_url", "https://fake.supabase.co");
      w.localStorage.setItem("sb_key", "anon-key");
    },
  });
  await new Promise(r => setTimeout(r, 350));
  const card = dom.window.document.querySelector(".gate-card");
  const txt = card ? card.textContent : "";
  const svg = dom.window.document.querySelector(".gate-card svg.brandmark");
  dom.window.close();
  return [
    (card ? "  ok   " : "  FAIL ") + "sign-in screen renders",
    (/on the right side of the curve/.test(txt) ? "  ok   " : "  FAIL ") + "slogan under the wordmark",
    (/bell curve club/i.test(txt) ? "  ok   " : "  FAIL ") + "wordmark reads Bell Curve Club",
    (svg ? "  ok   " : "  FAIL ") + "bell curve mark drawn as SVG",
  ];
}

(async () => {
  let fails = 0;
  console.log(EMPTY ? "(empty database)" : "(with sample data)");
  console.log("=== SIGNED OUT ===");
  (await runGate()).forEach(l => { if (l.startsWith("  FAIL")) fails++; console.log(l); });
  for (const [role, uid] of [["admin", UID.admin], ["tutor", UID.tutor], ["parent", UID.parent], ["student", UID.student]]) {
    const { results, errors, modals, checks } = await runRole(role, uid, EMPTY);
    console.log("\n=== " + role.toUpperCase() + " ===");
    results.forEach(r => {
      const flag = r.ok ? "  ok  " : "FAIL  ";
      if (!r.ok) fails++;
      console.log("  " + flag + r.route.padEnd(12) + String(r.chars).padStart(6) + " chars " + (r.err ? " :: " + r.err : ""));
    });
    modals.forEach(m => { if (m.includes("NO MODAL") || m.includes("not found")) { fails++; console.log("  MODAL " + m); } else console.log("  modal " + m); });
    (checks || []).forEach(c => { if (c.startsWith("  FAIL")) fails++; console.log(c); });
    errors.slice(0, 8).forEach(e => { fails++; console.log("  ERROR " + e.slice(0, 200)); });
  }
  console.log("\n" + (fails ? fails + " problem(s)" : "all green"));
  process.exit(fails ? 1 : 0);
})();
