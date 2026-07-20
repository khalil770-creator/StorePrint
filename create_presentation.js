"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_4x3"; // 10" x 7.5"

// ── helpers ──────────────────────────────────────────────────────────────────
const makeShadow = () => ({ type: "outer", blur: 4, offset: 2, angle: 45, color: "000000", opacity: 0.10 });

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || "FFFFFF" },
    line: opts.border ? { color: opts.border, width: 1 } : { color: "E2E8F0", width: 1 },
    shadow: makeShadow(),
  });
}

function addLeftBorder(slide, x, y, h, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.08, h,
    fill: { color },
    line: { color, width: 0 },
  });
}

function addDashedBox(slide, x, y, w, h, text, bgColor, textColor) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: bgColor || "F0FDF4" },
    line: { color: "10B981", width: 1, dashType: "dash" },
  });
  slide.addText(text, {
    x, y, w, h,
    fontSize: 12, color: textColor || "10B981",
    fontFace: "Calibri", align: "center", valign: "middle",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — COVER
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addShape(pres.shapes.OVAL, {
    x: 7.5, y: -1, w: 5, h: 5,
    fill: { color: "10B981", transparency: 85 },
    line: { color: "10B981", width: 0 },
  });

  slide.addText("StorePrint", {
    x: 0.5, y: 1.8, w: 9, h: 1.5,
    fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  slide.addText("Brand Store Management Platform", {
    x: 0.5, y: 3.5, w: 9, h: 0.7,
    fontSize: 24, bold: true, color: "10B981", fontFace: "Calibri",
  });
  slide.addText("Unify. Audit. Operate. Grow.", {
    x: 0.5, y: 4.3, w: 9, h: 0.5,
    fontSize: 16, italic: true, color: "FFFFFF", fontFace: "Calibri",
  });
  slide.addText("Executive Presentation  |  2026", {
    x: 0.5, y: 6.8, w: 9, h: 0.4,
    fontSize: 12, color: "94A3B8", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — THE PROBLEM
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("The Challenge Facing Multi-Store Brands", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri",
  });

  const cards = [
    { x: 0.5, y: 1.3, title: "Scattered Operations", body: "No single platform to manage compliance, attendance, assets and communication across all stores" },
    { x: 5.2, y: 1.3, title: "Manual Auditing", body: "Paper-based checklists, inconsistent standards, no GPS verification or scoring" },
    { x: 0.5, y: 3.3, title: "Attendance Gaps", body: "No real-time visibility of who is on the floor; clock-ins unverified and unreliable" },
    { x: 5.2, y: 3.3, title: "High SaaS Costs", body: "Global platforms charge $15-50/user/month with limited customisation or data control" },
  ];

  cards.forEach(c => {
    addCard(slide, c.x, c.y, 4.3, 1.8, { fill: "FFFFFF" });
    addLeftBorder(slide, c.x, c.y, 1.8, "10B981");
    slide.addText([
      { text: c.title, options: { bold: true, fontSize: 14, color: "0F172A", breakLine: true } },
      { text: c.body, options: { fontSize: 11, color: "334155" } },
    ], { x: c.x + 0.18, y: c.y + 0.15, w: 4.0, h: 1.5, fontFace: "Calibri", valign: "top" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — THE SOLUTION
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("StorePrint", {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 44, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  slide.addText("One platform. Seven modules. Complete store control.", {
    x: 0.5, y: 1.4, w: 9, h: 0.5,
    fontSize: 20, color: "10B981", fontFace: "Calibri",
  });

  const cols = [
    { x: 0.4, icon: "Mobile App", body: "iOS, Android & Web\nStaff, managers, auditors" },
    { x: 3.6, icon: "Admin Portal", body: "Web dashboard\nFull brand oversight" },
    { x: 6.8, icon: "API Backend", body: "Self-hosted\nSecure, scalable, yours" },
  ];

  cols.forEach(c => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: c.x, y: 2.1, w: 2.8, h: 3.0,
      fill: { color: "1E293B" },
      line: { color: "1E293B", width: 0 },
    });
    slide.addText(c.icon, { x: c.x, y: 2.4, w: 2.8, h: 0.5, fontSize: 18, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
    slide.addText(c.body, { x: c.x, y: 3.0, w: 2.8, h: 1.5, fontSize: 13, color: "94A3B8", align: "center", fontFace: "Calibri" });
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 6.7, w: 10, h: 0.8,
    fill: { color: "10B981" },
    line: { color: "10B981", width: 0 },
  });
  slide.addText("React Native  ·  Node.js  ·  PostgreSQL  ·  Docker  ·  Self-Hosted", {
    x: 0, y: 6.7, w: 10, h: 0.8,
    fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Technical Architecture", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri",
  });

  const sections = [
    { x: 0.5, label: "MOBILE APP", headerColor: "10B981", boxes: ["iOS App", "Android App", "Web Browser"] },
    { x: 3.5, label: "API LAYER", headerColor: "0F172A", boxes: ["Express API", "Auth / JWT", "GPS Verify", "Permissions"] },
    { x: 6.8, label: "INFRASTRUCTURE", headerColor: "334155", boxes: ["PostgreSQL", "MinIO Storage", "Redis Cache", "Meilisearch"] },
  ];

  sections.forEach(s => {
    const w = 2.5;
    slide.addShape(pres.shapes.RECTANGLE, { x: s.x, y: 1.2, w, h: 0.4, fill: { color: s.headerColor }, line: { color: s.headerColor, width: 0 } });
    slide.addText(s.label, { x: s.x, y: 1.2, w, h: 0.4, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
    s.boxes.forEach((b, i) => {
      const by = 1.7 + i * 0.65;
      slide.addShape(pres.shapes.RECTANGLE, { x: s.x, y: by, w, h: 0.55, fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 1 } });
      slide.addText(b, { x: s.x, y: by, w, h: 0.55, fontSize: 11, color: "334155", align: "center", valign: "middle", fontFace: "Calibri" });
    });
  });

  [{ x1: 3.1, x2: 3.45 }, { x1: 6.35, x2: 6.75 }].forEach(a => {
    slide.addShape(pres.shapes.LINE, {
      x: a.x1, y: 2.47, w: a.x2 - a.x1, h: 0,
      line: { color: "10B981", width: 2 },
    });
  });

  slide.addText("All containerised via Docker  ·  Self-hosted or cloud-deployable", {
    x: 1, y: 6.5, w: 8, h: 0.4,
    fontSize: 12, italic: true, color: "64748B", align: "center", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5 — MODULE OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Seven Integrated Modules", {
    x: 0.5, y: 0.3, w: 9, h: 0.7,
    fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });

  const allModules = [
    { x: 0.3, y: 1.3, name: "Brand Hub", desc: "Digital asset library" },
    { x: 2.7, y: 1.3, name: "Auditing", desc: "GPS-verified compliance" },
    { x: 5.1, y: 1.3, name: "Attendance", desc: "Real-time presence" },
    { x: 7.5, y: 1.3, name: "Roster", desc: "Shift management" },
    { x: 1.2, y: 3.1, name: "Store Ops", desc: "6 operational modules" },
    { x: 3.9, y: 3.1, name: "Analytics", desc: "Performance insights" },
    { x: 6.6, y: 3.1, name: "Admin", desc: "Full brand control" },
  ];

  allModules.forEach(m => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: m.x, y: m.y, w: 2.1, h: 1.5,
      fill: { color: "10B981" }, line: { color: "10B981", width: 0 },
    });
    slide.addText(m.name, { x: m.x, y: m.y + 0.35, w: 2.1, h: 0.4, fontSize: 13, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
    slide.addText(m.desc, { x: m.x, y: m.y + 0.8, w: 2.1, h: 0.55, fontSize: 10, color: "FFFFFF", align: "center", fontFace: "Calibri" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 6 — BRAND HUB
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Brand Hub", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });
  slide.addText("Centralised Digital Asset Library", { x: 0.5, y: 0.95, w: 9, h: 0.4, fontSize: 18, color: "0F172A", fontFace: "Calibri" });

  const features = [
    "Brand guidelines, logos, campaigns in one place",
    "Supports images, PDFs and documents",
    "Category-based organisation and search",
    "One-tap WhatsApp & email sharing",
    "Role-based access control per module",
  ];
  const items = [];
  features.forEach((f, i) => {
    items.push({ text: "Check  ", options: { bold: true, color: "10B981", fontSize: 14 } });
    items.push({ text: f, options: { color: "334155", fontSize: 14, breakLine: true } });
    items.push({ text: "", options: { breakLine: true } });
  });

  slide.addText(items, { x: 0.5, y: 1.5, w: 5.2, h: 4.5, fontFace: "Calibri", valign: "top" });
  addDashedBox(slide, 6.0, 1.3, 3.5, 4.5, "[Screenshot:\nBrand Hub\nMobile App]");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 7 — AUDITING pt1
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Store Compliance Auditing", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });
  slide.addText("GPS-verified, scored, automated", { x: 0.5, y: 0.95, w: 9, h: 0.4, fontSize: 18, color: "0F172A", fontFace: "Calibri" });

  addDashedBox(slide, 0.3, 1.4, 4.0, 4.8, "[Screenshot:\nAudit Form\nMobile App]");

  const fcards = [
    { y: 1.4, title: "Smart Templates", body: "Yes/No, Photo, Score 1-5, Free Text questions" },
    { y: 2.6, title: "Weighted Scoring", body: "Each question carries a weight multiplier (1-5x)" },
    { y: 3.8, title: "GPS Enforcement", body: "Auditor must be physically at store to submit" },
    { y: 5.0, title: "Auto Corrective Actions", body: "Critical failures instantly create assigned action items" },
  ];

  fcards.forEach(c => {
    addCard(slide, 4.6, c.y, 5.0, 1.0, { fill: "FFFFFF" });
    slide.addText([
      { text: c.title, options: { bold: true, fontSize: 14, color: "0F172A", breakLine: true } },
      { text: c.body, options: { fontSize: 11, color: "334155" } },
    ], { x: 4.75, y: c.y + 0.1, w: 4.7, h: 0.8, fontFace: "Calibri", valign: "top" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 8 — AUDIT WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Audit Workflow", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri" });

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.32, w: 8.2, h: 0.06, fill: { color: "E2E8F0" }, line: { color: "E2E8F0", width: 0 } });

  const steps = [
    { x: 0.7, n: "1", title: "Admin Builds\nTemplate" },
    { x: 2.7, n: "2", title: "Auditor Selects\nStore" },
    { x: 4.7, n: "3", title: "Answers All\nQuestions" },
    { x: 6.7, n: "4", title: "GPS Verified\nSubmission" },
    { x: 8.7, n: "5", title: "Score & Report\nGenerated" },
  ];

  steps.forEach(s => {
    slide.addShape(pres.shapes.OVAL, {
      x: s.x - 0.33, y: 2.0, w: 0.65, h: 0.65,
      fill: { color: "10B981" }, line: { color: "10B981", width: 0 },
    });
    slide.addText(s.n, { x: s.x - 0.33, y: 2.0, w: 0.65, h: 0.65, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
    slide.addText(s.title, { x: s.x - 1.0, y: 1.3, w: 2.0, h: 0.6, fontSize: 12, bold: true, color: "0F172A", align: "center", fontFace: "Calibri" });
  });

  [[1.05, 2.35], [3.05, 4.35], [5.05, 6.35], [7.05, 8.35]].forEach(([x1, x2]) => {
    slide.addShape(pres.shapes.LINE, { x: x1, y: 2.32, w: x2 - x1, h: 0, line: { color: "10B981", width: 1.5 } });
  });

  const stats = [
    { x: 0.5, title: "Auto-weighted scoring", body: "Eliminates manual calculation" },
    { x: 3.6, title: "GPS timestamped", body: "Every submission geo-verified" },
    { x: 6.7, title: "Instant corrective actions", body: "Critical fails auto-assigned" },
  ];

  stats.forEach(s => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: s.x, y: 4.5, w: 2.8, h: 1.3,
      fill: { color: "ECFDF5" }, line: { color: "10B981", width: 1 },
    });
    slide.addText([
      { text: s.title, options: { bold: true, fontSize: 13, color: "10B981", breakLine: true } },
      { text: s.body, options: { fontSize: 11, color: "64748B" } },
    ], { x: s.x + 0.1, y: 4.6, w: 2.6, h: 1.1, fontFace: "Calibri", valign: "middle", align: "center" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 9 — ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Field Attendance", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });
  slide.addText("Real-time GPS-verified presence management", { x: 0.5, y: 0.95, w: 9, h: 0.4, fontSize: 18, color: "0F172A", fontFace: "Calibri" });

  const features = [
    "GPS clock in/out - verified against store geofence",
    "Real-time live presence dashboard",
    "Late arrival & early exit detection",
    "Full attendance log with timestamps",
    "Status tracking: Present / Late / Absent",
  ];
  const items = [];
  features.forEach((f, i) => {
    items.push({ text: "Check  ", options: { bold: true, color: "10B981", fontSize: 14 } });
    items.push({ text: f, options: { color: "334155", fontSize: 14, breakLine: true } });
    items.push({ text: "", options: { breakLine: true } });
  });

  slide.addText(items, { x: 0.5, y: 1.5, w: 5.2, h: 4.0, fontFace: "Calibri", valign: "top" });
  addDashedBox(slide, 6.0, 1.3, 3.5, 4.5, "[Screenshot:\nAttendance\nClock In Screen]");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 10 — ROSTER
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Roster Management", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });
  addDashedBox(slide, 0.3, 1.2, 4.2, 5.0, "[Screenshot:\nRoster\nManager View]");

  slide.addText("FOR MANAGERS", { x: 4.8, y: 1.2, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: "0F172A", fontFace: "Calibri" });
  const mgrBullets = [
    "Create weekly/monthly rosters",
    "Assign shifts: date, time, role, zone",
    "Draft to Publish workflow",
    "Morning / Evening classification",
  ];
  const mgrItems = mgrBullets.map((b, i) => ({ text: "  " + b, options: { fontSize: 13, color: "334155", breakLine: i < mgrBullets.length - 1 } }));
  slide.addText(mgrItems, { x: 4.8, y: 1.65, w: 4.8, h: 1.9, fontFace: "Calibri", valign: "top", bullet: false });

  slide.addText("FOR STAFF", { x: 4.8, y: 3.8, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: "0F172A", fontFace: "Calibri" });
  const staffBullets = [
    "My Shifts view (upcoming + past)",
    "Instant visibility on roster publish",
    "Total hours display",
  ];
  const staffItems = staffBullets.map((b, i) => ({ text: "  " + b, options: { fontSize: 13, color: "334155", breakLine: i < staffBullets.length - 1 } }));
  slide.addText(staffItems, { x: 4.8, y: 4.25, w: 4.8, h: 1.5, fontFace: "Calibri", valign: "top" });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 11 — STORE OPS
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Store Operations", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });
  slide.addText("Six operational modules in one tab", { x: 0.5, y: 0.95, w: 5, h: 0.4, fontSize: 18, color: "0F172A", fontFace: "Calibri" });

  const modules = [
    { x: 0.4, y: 1.6, name: "Visual Merchandising", desc: "Planogram compliance & VM tasks" },
    { x: 3.55, y: 1.6, name: "Campaigns", desc: "Campaign rollout tracking" },
    { x: 6.6, y: 1.6, name: "Signage", desc: "In-store signage compliance" },
    { x: 0.4, y: 3.3, name: "Training", desc: "Staff onboarding & certification" },
    { x: 3.55, y: 3.3, name: "Environment", desc: "Store condition checks" },
    { x: 6.6, y: 3.3, name: "Customer Experience", desc: "CX surveys & feedback" },
  ];

  modules.forEach(m => {
    addCard(slide, m.x, m.y, 2.9, 1.5, { fill: "FFFFFF" });
    addLeftBorder(slide, m.x, m.y, 1.5, "10B981");
    slide.addText([
      { text: m.name, options: { bold: true, fontSize: 13, color: "0F172A", breakLine: true } },
      { text: m.desc, options: { fontSize: 11, color: "334155" } },
    ], { x: m.x + 0.2, y: m.y + 0.2, w: 2.5, h: 1.1, fontFace: "Calibri", valign: "top" });
  });

  addDashedBox(slide, 0.5, 5.1, 9, 1.5, "[Screenshot: Store Ops - Tab View]");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 12 — ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Analytics & Insights", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "10B981", fontFace: "Calibri" });

  const metrics = [
    { x: 0.3, fill: "0F172A", title: "Audit Scores", body: "Compliance % by store", bodyColor: "94A3B8" },
    { x: 2.6, fill: "10B981", title: "Attendance", body: "Real-time presence data", bodyColor: "FFFFFF" },
    { x: 4.9, fill: "0F172A", title: "Benchmarks", body: "Compare stores side by side", bodyColor: "94A3B8" },
    { x: 7.2, fill: "10B981", title: "Compliance", body: "Brand standard adherence", bodyColor: "FFFFFF" },
  ];

  metrics.forEach(m => {
    slide.addShape(pres.shapes.RECTANGLE, { x: m.x, y: 1.2, w: 2.1, h: 1.6, fill: { color: m.fill }, line: { color: m.fill, width: 0 }, shadow: makeShadow() });
    slide.addText(m.title, { x: m.x, y: 1.55, w: 2.1, h: 0.4, fontSize: 14, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
    slide.addText(m.body, { x: m.x, y: 1.95, w: 2.1, h: 0.55, fontSize: 11, color: m.bodyColor, align: "center", fontFace: "Calibri" });
  });

  addDashedBox(slide, 0.5, 3.1, 9, 3.5, "[Screenshot: Analytics Dashboard]");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 13 — ADMIN PORTAL
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Admin Web Portal", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  slide.addText("Complete brand oversight from a browser", { x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 20, color: "10B981", fontFace: "Calibri" });

  const cards = [
    { x: 0.4, title: "User Management", body: "Create users\nAssign roles\nSet granular permissions\nper module" },
    { x: 3.6, title: "Store Management", body: "GPS geofence setup\nStore hierarchy\nStaff assignment\nActive/inactive status" },
    { x: 6.8, title: "Audit Builder", body: "Build templates\nSet categories\nQuestion weights\nPublish & manage" },
  ];

  cards.forEach(c => {
    slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: 1.7, w: 2.8, h: 3.5, fill: { color: "1E293B" }, line: { color: "1E293B", width: 0 }, shadow: makeShadow() });
    slide.addText(c.title, { x: c.x + 0.1, y: 1.8, w: 2.6, h: 0.45, fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Calibri" });
    slide.addText(c.body, { x: c.x + 0.1, y: 2.35, w: 2.6, h: 2.7, fontSize: 12, color: "94A3B8", fontFace: "Calibri", valign: "top" });
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 5.5, w: 7, h: 1.1, fill: { color: "1E293B" }, line: { color: "334155", width: 1, dashType: "dash" } });
  slide.addText("[Screenshot: Admin Portal - Dashboard]", { x: 1.5, y: 5.5, w: 7, h: 1.1, fontSize: 11, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 14 — PERMISSIONS TABLE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Granular Role-Based Access Control", { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, bold: true, color: "0F172A", fontFace: "Calibri" });

  function mkHdr(text) {
    return { text, options: { fill: { color: "0F172A" }, color: "FFFFFF", bold: true, fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function mkFull(bg) {
    return { text: "Full Access", options: { fill: { color: bg }, color: "10B981", fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function mkRead(bg) {
    return { text: "Read Only", options: { fill: { color: bg }, color: "F59E0B", fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function mkNone(bg) {
    return { text: "-", options: { fill: { color: bg }, color: "CBD5E1", fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function mkRole(role, bg) {
    return { text: role, options: { bold: true, fontSize: 10, fontFace: "Calibri", color: "0F172A", fill: { color: bg } } };
  }

  const rows = [
    [mkHdr("Role"), mkHdr("Brand Hub"), mkHdr("Auditing"), mkHdr("Attendance"), mkHdr("Roster"), mkHdr("Store Ops"), mkHdr("Analytics"), mkHdr("Admin")],
    [mkRole("Super Admin", "FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF")],
    [mkRole("Area Manager", "F8FAFC"), mkRead("F8FAFC"), mkFull("F8FAFC"), mkFull("F8FAFC"), mkFull("F8FAFC"), mkFull("F8FAFC"), mkFull("F8FAFC"), mkNone("F8FAFC")],
    [mkRole("Store Manager", "FFFFFF"), mkRead("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkFull("FFFFFF"), mkRead("FFFFFF"), mkNone("FFFFFF")],
    [mkRole("Auditor", "F8FAFC"), mkNone("F8FAFC"), mkFull("F8FAFC"), mkRead("F8FAFC"), mkRead("F8FAFC"), mkNone("F8FAFC"), mkRead("F8FAFC"), mkNone("F8FAFC")],
    [mkRole("Field Staff", "FFFFFF"), mkNone("FFFFFF"), mkNone("FFFFFF"), mkFull("FFFFFF"), mkRead("FFFFFF"), mkNone("FFFFFF"), mkNone("FFFFFF"), mkNone("FFFFFF")],
    [mkRole("Customer Support", "F8FAFC"), mkRead("F8FAFC"), mkNone("F8FAFC"), mkNone("F8FAFC"), mkNone("F8FAFC"), mkFull("F8FAFC"), mkNone("F8FAFC"), mkNone("F8FAFC")],
  ];

  slide.addTable(rows, {
    x: 0.3, y: 0.9, w: 9.4, h: 5.8,
    colW: [1.8, 1.2, 1.2, 1.2, 1.0, 1.0, 1.0, 1.0],
    border: { pt: 0.5, color: "E2E8F0" },
    fontSize: 10,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 15 — COMPETITIVE LANDSCAPE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Global Market Comparison", { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  slide.addText("StorePrint vs established players - including AI-powered platforms", { x: 0.5, y: 0.85, w: 9, h: 0.4, fontSize: 15, color: "10B981", fontFace: "Calibri" });

  const row1Cards = [
    { x: 0.2, y: 1.4, w: 2.2, h: 1.7, name: "Bindy", desc: "Retail audit & task mgmt", price: "$25-40/user/mo", isWooqer: false },
    { x: 2.6, y: 1.4, w: 2.2, h: 1.7, name: "GoSpotCheck", desc: "Field execution platform\n(now Movista)", price: "$30-50/user/mo", isWooqer: false },
    { x: 5.0, y: 1.4, w: 2.2, h: 1.7, name: "Reflexis/Zebra", desc: "Enterprise workforce\nmanagement", price: "$20-35/user/mo", isWooqer: false },
    { x: 7.4, y: 1.4, w: 2.2, h: 1.7, name: "Tulip Retail", desc: "Store ops platform\nNo GPS auditing", price: "$40-60/user/mo", isWooqer: false },
  ];
  const row2Cards = [
    { x: 1.0, y: 3.3, w: 2.5, h: 1.7, name: "StoreForce", desc: "Retail workforce mgmt\nScheduling focus only", price: "$15-25/user/mo", isWooqer: false },
    { x: 3.75, y: 3.3, w: 2.5, h: 1.85, name: "Wooqer", desc: "AI-powered frontline OS\nAudits, tasks, AI planogram\n450+ enterprise clients", price: "Custom pricing\nEst. $20-40/user/mo", isWooqer: true },
    { x: 6.5, y: 3.3, w: 2.5, h: 1.7, name: "Axonify", desc: "Retail training platform\nSingle module only", price: "$10-20/user/mo", isWooqer: false },
  ];

  [...row1Cards, ...row2Cards].forEach(c => {
    if (c.isWooqer) {
      slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: c.w, h: 0.06, fill: { color: "F59E0B" }, line: { color: "F59E0B", width: 0 } });
    }
    slide.addShape(pres.shapes.RECTANGLE, {
      x: c.x, y: c.y + (c.isWooqer ? 0.05 : 0), w: c.w, h: c.h - (c.isWooqer ? 0.05 : 0),
      fill: { color: "1E293B" }, line: { color: "1E293B", width: 0 }, shadow: makeShadow(),
    });
    slide.addText(c.name, { x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.3, fontSize: 13, bold: true, color: "FFFFFF", fontFace: "Calibri" });
    if (c.isWooqer) {
      slide.addText("AI-Powered", { x: c.x + 0.1, y: c.y + 0.42, w: c.w - 0.2, h: 0.22, fontSize: 10, bold: true, color: "F59E0B", fontFace: "Calibri" });
      slide.addText(c.desc, { x: c.x + 0.1, y: c.y + 0.65, w: c.w - 0.2, h: 0.65, fontSize: 9, color: "94A3B8", fontFace: "Calibri" });
      slide.addText(c.price, { x: c.x + 0.1, y: c.y + 1.35, w: c.w - 0.2, h: 0.4, fontSize: 9, bold: true, color: "EF4444", fontFace: "Calibri" });
    } else {
      slide.addText(c.desc, { x: c.x + 0.1, y: c.y + 0.42, w: c.w - 0.2, h: 0.7, fontSize: 10, color: "94A3B8", fontFace: "Calibri" });
      slide.addText(c.price, { x: c.x + 0.1, y: c.y + 1.3, w: c.w - 0.2, h: 0.32, fontSize: 11, bold: true, color: "EF4444", fontFace: "Calibri" });
    }
  });

  // StorePrint badge
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.2, y: 5.4, w: 9.6, h: 1.0, fill: { color: "10B981" }, line: { color: "10B981", width: 0 } });
  slide.addText("StorePrint  |  Self-Hosted  |  No Per-User Fees  |  7 Integrated Modules  |  GPS-First", {
    x: 0.2, y: 5.4, w: 9.6, h: 1.0, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 16 — FEATURE COMPARISON TABLE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Feature Comparison", { x: 0.3, y: 0.15, w: 9.4, h: 0.55, fontSize: 28, bold: true, color: "0F172A", fontFace: "Calibri" });

  const colW = [2.6, 1.2, 1.2, 1.1, 1.2, 1.2, 1.2];

  function hdr(text) {
    return { text, options: { fill: { color: "0F172A" }, color: "FFFFFF", bold: true, fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function sp(text, bg) {
    const color = text === "Yes" ? "10B981" : text === "No" ? "EF4444" : "F59E0B";
    return { text, options: { fill: { color: "ECFDF5" }, color, fontSize: 10, fontFace: "Calibri", align: "center", bold: text === "Yes" } };
  }
  function wq(text) {
    const color = text === "Yes" ? "10B981" : text === "No" ? "EF4444" : "F59E0B";
    return { text, options: { fill: { color: "FFFBEB" }, color, fontSize: 10, fontFace: "Calibri", align: "center", bold: text === "Yes" } };
  }
  function ot(text, bg) {
    const color = text === "Yes" ? "10B981" : text === "No" ? "EF4444" : "F59E0B";
    return { text, options: { fill: { color: bg }, color, fontSize: 10, fontFace: "Calibri", align: "center" } };
  }
  function feat(text, bg) {
    return { text, options: { fill: { color: bg }, color: "0F172A", fontSize: 10, fontFace: "Calibri" } };
  }

  function mkRow(f, s, w, bi, gs, rf, tl, even) {
    const bg = even ? "FFFFFF" : "F8FAFC";
    return [feat(f, bg), sp(s, "ECFDF5"), wq(w), ot(bi, bg), ot(gs, bg), ot(rf, bg), ot(tl, bg)];
  }

  const rows = [
    [hdr("Feature"), hdr("StorePrint"), hdr("Wooqer"), hdr("Bindy"), hdr("GoSpotCheck"), hdr("Reflexis"), hdr("Tulip")],
    mkRow("GPS-Verified Auditing", "Yes", "Yes", "Yes", "Yes", "No", "No", true),
    mkRow("Photo Evidence in Audits", "Yes", "Yes", "Yes", "Yes", "No", "No", false),
    mkRow("GPS Clock In/Out", "Yes", "No", "No", "No", "Yes", "No", true),
    mkRow("Roster/Shift Management", "Yes", "No", "No", "No", "Yes", "No", false),
    mkRow("Digital Asset Library", "Yes", "No", "No", "No", "No", "Yes", true),
    mkRow("Self-Hosted Option", "Yes", "No", "No", "No", "No", "No", false),
    mkRow("Mobile + Web App", "Yes", "Yes", "Yes", "Yes", "Yes", "Yes", true),
    mkRow("Corrective Action Mgmt", "Yes", "Yes", "Yes", "Yes", "No", "No", false),
    mkRow("Custom Permissions", "Yes", "Yes", "Limited", "Limited", "Yes", "Limited", true),
    mkRow("No Per-User Fees", "Yes", "No", "No", "No", "No", "No", false),
    mkRow("AI-Powered Features", "No", "Yes", "No", "No", "No", "No", true),
  ];

  slide.addTable(rows, {
    x: 0.15, y: 0.75, w: 9.7, h: 6.3,
    colW,
    border: { pt: 0.5, color: "E2E8F0" },
  });

  slide.addText("* Wooqer pricing is custom/enterprise. AI features include SensEye planogram AI, Lens SOP assistant, and Wally co-pilot.", {
    x: 0.15, y: 7.15, w: 9.7, h: 0.3, fontSize: 9, italic: true, color: "64748B", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 17 — COST COMPARISON
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Cost Benefit Analysis", { x: 0.5, y: 0.2, w: 9, h: 0.55, fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri" });
  slide.addText("50 users  ·  3-year total cost of ownership", { x: 0.5, y: 0.8, w: 9, h: 0.4, fontSize: 16, color: "334155", fontFace: "Calibri" });

  // LEFT
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.4, w: 2.9, h: 4.8, fill: { color: "FEF2F2" }, line: { color: "EF4444", width: 1.5 } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.4, w: 2.9, h: 0.45, fill: { color: "EF4444" }, line: { color: "EF4444", width: 0 } });
  slide.addText("Avg. Competitor", { x: 0.3, y: 1.4, w: 2.9, h: 0.45, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  slide.addText("$15,000", { x: 0.3, y: 2.0, w: 2.9, h: 0.65, fontSize: 36, bold: true, color: "EF4444", align: "center", fontFace: "Calibri" });
  slide.addText("Year 1 cost", { x: 0.3, y: 2.68, w: 2.9, h: 0.3, fontSize: 12, color: "334155", align: "center", fontFace: "Calibri" });
  slide.addText("Avg $25/user/month\n50 users = $1,250/mo\nYear 2: $15,000\nYear 3: $15,000", { x: 0.42, y: 3.05, w: 2.65, h: 1.5, fontSize: 12, color: "334155", fontFace: "Calibri", valign: "top" });
  slide.addText("3-Year Total: $45,000", { x: 0.3, y: 4.75, w: 2.9, h: 0.55, fontSize: 13, bold: true, color: "EF4444", align: "center", fontFace: "Calibri" });

  // MIDDLE
  slide.addShape(pres.shapes.RECTANGLE, { x: 3.55, y: 1.2, w: 3.0, h: 5.2, fill: { color: "ECFDF5" }, line: { color: "10B981", width: 2 } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 3.55, y: 1.2, w: 3.0, h: 0.45, fill: { color: "10B981" }, line: { color: "10B981", width: 0 } });
  slide.addText("StorePrint", { x: 3.55, y: 1.2, w: 3.0, h: 0.45, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  slide.addText("$3,600", { x: 3.55, y: 1.8, w: 3.0, h: 0.75, fontSize: 42, bold: true, color: "10B981", align: "center", fontFace: "Calibri" });
  slide.addText("Year 1 cost", { x: 3.55, y: 2.58, w: 3.0, h: 0.3, fontSize: 12, color: "334155", align: "center", fontFace: "Calibri" });
  slide.addText("Infrastructure only ~$300/mo\nNo per-user fees ever\nYear 2: $3,600\nYear 3: $3,600", { x: 3.67, y: 3.0, w: 2.75, h: 1.5, fontSize: 12, color: "334155", fontFace: "Calibri", valign: "top" });
  slide.addText("3-Year Total: $10,800", { x: 3.55, y: 4.85, w: 3.0, h: 0.55, fontSize: 13, bold: true, color: "10B981", align: "center", fontFace: "Calibri" });

  // RIGHT
  slide.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.4, w: 2.8, h: 4.8, fill: { color: "FFFBEB" }, line: { color: "F59E0B", width: 1.5 } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.4, w: 2.8, h: 0.45, fill: { color: "F59E0B" }, line: { color: "F59E0B", width: 0 } });
  slide.addText("Your Savings", { x: 6.85, y: 1.4, w: 2.8, h: 0.45, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  slide.addText("$34,200", { x: 6.85, y: 2.0, w: 2.8, h: 0.65, fontSize: 36, bold: true, color: "F59E0B", align: "center", fontFace: "Calibri" });
  slide.addText("3-Year savings", { x: 6.85, y: 2.68, w: 2.8, h: 0.3, fontSize: 12, color: "334155", align: "center", fontFace: "Calibri" });
  slide.addText("Year 1 saved: $11,400\nYear 2 saved: $11,400\nYear 3 saved: $11,400", { x: 6.97, y: 3.05, w: 2.55, h: 1.2, fontSize: 12, color: "334155", fontFace: "Calibri", valign: "top" });
  slide.addShape(pres.shapes.RECTANGLE, { x: 7.1, y: 4.5, w: 2.3, h: 0.55, fill: { color: "0F172A" }, line: { color: "0F172A", width: 0 } });
  slide.addText("76% ROI", { x: 7.1, y: 4.5, w: 2.3, h: 0.55, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });

  slide.addText("* Wooqer: custom enterprise pricing, est. $20-40/user/month. 50 users approx $12,000-$24,000/year - still 3-7x more than StorePrint infrastructure costs.", {
    x: 0.3, y: 6.75, w: 9.4, h: 0.45, fontSize: 9, italic: true, color: "64748B", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 18 — ROI DEEP DIVE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Return on Investment", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri" });

  const cards = [
    { x: 0.4, y: 1.2, title: "Direct Cost Savings", body: "No $25-50/user/month licensing.\nFor 50 users over 3 years: save $34,200+" },
    { x: 5.3, y: 1.2, title: "Time Savings", body: "GPS-verified auditing cuts admin time ~60%.\nAuto-scoring eliminates manual calculation" },
    { x: 0.4, y: 3.9, title: "Compliance Lift", body: "Real-time visibility drives store compliance.\nIssues corrected same-day, not next week" },
    { x: 5.3, y: 3.9, title: "Operational Efficiency", body: "Unified platform replaces 6+ separate tools.\nOne login for all store operations" },
  ];

  cards.forEach(c => {
    slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: 4.3, h: 2.4, fill: { color: "1E293B" }, line: { color: "1E293B", width: 0 }, shadow: makeShadow() });
    slide.addText(c.title, { x: c.x + 0.15, y: c.y + 0.2, w: 4.0, h: 0.45, fontSize: 15, bold: true, color: "FFFFFF", fontFace: "Calibri" });
    slide.addText(c.body, { x: c.x + 0.15, y: c.y + 0.75, w: 4.0, h: 1.5, fontSize: 12, color: "94A3B8", fontFace: "Calibri", valign: "top" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 19 — DEPLOYMENT
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Deployment & Security", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri" });

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.2, w: 4.5, h: 0.45, fill: { color: "0F172A" }, line: { color: "0F172A", width: 0 } });
  slide.addText("Self-Hosted Architecture", { x: 0.4, y: 1.2, w: 4.5, h: 0.45, fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  const leftItems = [
    "Docker containerised - deploy anywhere",
    "JWT authentication + role permissions",
    "GPS geofencing per store",
    "Your data stays on your servers",
    "Redis caching for performance",
  ];
  leftItems.forEach((item, i) => {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.75 + i * 0.6, w: 4.5, h: 0.5, fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 1 } });
    slide.addText(item, { x: 0.55, y: 1.75 + i * 0.6, w: 4.2, h: 0.5, fontSize: 12, color: "334155", valign: "middle", fontFace: "Calibri" });
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.4, h: 0.45, fill: { color: "10B981" }, line: { color: "10B981", width: 0 } });
  slide.addText("What's Included", { x: 5.2, y: 1.2, w: 4.4, h: 0.45, fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  const rightItems = [
    "PostgreSQL database",
    "MinIO file storage (S3-compatible)",
    "Meilisearch for fast search",
    "Ntfy push notifications",
    "nginx reverse proxy",
    "Full Docker Compose setup",
  ];
  rightItems.forEach((item, i) => {
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.75 + i * 0.6, w: 4.4, h: 0.5, fill: { color: "ECFDF5" }, line: { color: "D1FAE5", width: 1 } });
    slide.addText(item, { x: 5.35, y: 1.75 + i * 0.6, w: 4.1, h: 0.5, fontSize: 12, color: "10B981", valign: "middle", fontFace: "Calibri" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 20 — USER PERSONAS
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Built for Real Users", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri" });

  const personas = [
    { x: 0.3, fill: "0F172A", name: "Area Manager", body: "Monitors all stores from one screen. Reviews audit scores, tracks attendance across locations, manages rosters.", bodyColor: "94A3B8" },
    { x: 3.55, fill: "10B981", name: "Store Manager", body: "Creates rosters, conducts audits, views live presence. Manages day-to-day store operations.", bodyColor: "FFFFFF" },
    { x: 6.8, fill: "0F172A", name: "Field Staff / Auditor", body: "Clocks in with GPS, fills audits on phone, views their roster. Simple focused interface.", bodyColor: "94A3B8" },
  ];

  personas.forEach(p => {
    slide.addShape(pres.shapes.RECTANGLE, { x: p.x, y: 1.2, w: 2.9, h: 4.5, fill: { color: p.fill }, line: { color: p.fill, width: 0 }, shadow: makeShadow() });
    slide.addText(p.name, { x: p.x + 0.1, y: 1.8, w: 2.7, h: 0.55, fontSize: 18, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
    slide.addText(p.body, { x: p.x + 0.15, y: 2.5, w: 2.6, h: 3.0, fontSize: 13, color: p.bodyColor, fontFace: "Calibri", valign: "top" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 21 — MOBILE HIGHLIGHTS
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Mobile-First Design", { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  slide.addText("Works on iOS, Android, and Web Browser", { x: 0.5, y: 0.85, w: 9, h: 0.4, fontSize: 18, color: "10B981", fontFace: "Calibri" });

  const highlights = [
    { x: 0.4, y: 1.5, title: "Cross-Platform", body: "Expo/React Native - one codebase, three platforms" },
    { x: 5.2, y: 1.5, title: "Role-Based Tabs", body: "Locked modules shown clearly per user role" },
    { x: 0.4, y: 2.9, title: "GPS-Native", body: "Camera, location, all device features built-in" },
    { x: 5.2, y: 2.9, title: "Web App", body: "Progressive Web App - works in any browser" },
  ];

  highlights.forEach(h => {
    slide.addShape(pres.shapes.RECTANGLE, { x: h.x, y: h.y, w: 4.3, h: 1.2, fill: { color: "1E293B" }, line: { color: "1E293B", width: 0 }, shadow: makeShadow() });
    slide.addText([
      { text: h.title, options: { bold: true, fontSize: 13, color: "FFFFFF", breakLine: true } },
      { text: h.body, options: { fontSize: 11, color: "94A3B8" } },
    ], { x: h.x + 0.15, y: h.y + 0.18, w: 4.0, h: 0.85, fontFace: "Calibri", valign: "top" });
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.2, w: 4.3, h: 2.4, fill: { color: "1E293B" }, line: { color: "FFFFFF", width: 1, dashType: "dash" } });
  slide.addText("[Screenshot:\nApp - Home Tab]", { x: 0.4, y: 4.2, w: 4.3, h: 2.4, fontSize: 11, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 4.2, w: 4.3, h: 2.4, fill: { color: "1E293B" }, line: { color: "FFFFFF", width: 1, dashType: "dash" } });
  slide.addText("[Screenshot:\nApp - Audit Form]", { x: 5.2, y: 4.2, w: 4.3, h: 2.4, fontSize: 11, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 22 — IMPLEMENTATION TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Implementation & Onboarding", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: "0F172A", fontFace: "Calibri" });

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.6, w: 8.4, h: 0.12, fill: { color: "E2E8F0" }, line: { color: "E2E8F0", width: 0 } });

  const phases = [
    { x: 0.8, n: "1", above: "Week 1\nSetup & Deploy", below: "Docker deployment\nDatabase setup\nInitial config" },
    { x: 3.5, n: "2", above: "Week 2\nConfigure", below: "Add stores & users\nSet permissions\nBuild audit templates" },
    { x: 6.2, n: "3", above: "Week 3\nOnboard", below: "Train managers\nPilot audit run\nGPS calibration" },
    { x: 8.9, n: "4", above: "Week 4\nGo Live", below: "Full rollout\nAll modules active\nMonitoring live" },
  ];

  phases.forEach(p => {
    slide.addShape(pres.shapes.OVAL, { x: p.x - 0.325, y: 2.27, w: 0.65, h: 0.65, fill: { color: "10B981" }, line: { color: "10B981", width: 0 } });
    slide.addText(p.n, { x: p.x - 0.325, y: 2.27, w: 0.65, h: 0.65, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Calibri" });
    slide.addText(p.above, { x: p.x - 1.0, y: 1.35, w: 2.0, h: 0.8, fontSize: 13, bold: true, color: "0F172A", align: "center", fontFace: "Calibri" });
    slide.addText(p.below, { x: p.x - 1.15, y: 3.1, w: 2.3, h: 1.4, fontSize: 11, color: "334155", align: "center", fontFace: "Calibri" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 23 — ROADMAP
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("Product Roadmap", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri" });

  const cols = [
    {
      x: 0.3, fill: "10B981", headerColor: "FFFFFF", itemColor: "FFFFFF",
      header: "NOW (Live)",
      items: ["Brand Hub", "GPS Auditing", "Field Attendance", "Roster Management", "Store Operations", "Analytics", "Admin Portal"],
    },
    {
      x: 3.55, fill: "1E293B", headerColor: "10B981", itemColor: "E2E8F0",
      header: "NEXT (Q3 2026)",
      items: ["Push notifications on publish", "Cloud photo upload", "Audit trend charts", "Shift swap approvals", "Offline mode (basic)"],
    },
    {
      x: 6.8, fill: "1E293B", headerColor: "F59E0B", itemColor: "E2E8F0",
      header: "FUTURE (Q4 2026+)",
      items: ["AI compliance insights", "Multi-brand support", "WhatsApp bot integration", "AI planogram checking", "Predictive analytics"],
    },
  ];

  cols.forEach(c => {
    slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: 1.2, w: 2.9, h: 5.0, fill: { color: c.fill }, line: { color: c.fill, width: 0 }, shadow: makeShadow() });
    slide.addText(c.header, { x: c.x + 0.1, y: 1.3, w: 2.7, h: 0.55, fontSize: 16, bold: true, color: c.headerColor, align: "center", fontFace: "Calibri" });
    const itemTexts = c.items.map((it, i) => ({
      text: "  " + it,
      options: { fontSize: 12, color: c.itemColor, breakLine: i < c.items.length - 1 },
    }));
    slide.addText(itemTexts, { x: c.x + 0.15, y: 2.0, w: 2.6, h: 4.0, fontFace: "Calibri", valign: "top", paraSpaceAfter: 5 });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 24 — WHY STOREPRINT
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Why Choose StorePrint?", { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 36, bold: true, color: "0F172A", fontFace: "Calibri" });

  const props = [
    { y: 1.0, title: "All-in-One Platform", desc: "7 modules replacing 6+ separate tools. One login, complete visibility." },
    { y: 2.05, title: "90% Cost Reduction", desc: "Self-hosted infrastructure only. No per-user licensing fees ever." },
    { y: 3.1, title: "GPS-First Design", desc: "Every clock-in, audit start, and submission geo-verified at the store." },
    { y: 4.15, title: "Data Sovereignty", desc: "Your data on your servers. No third-party cloud. Full compliance control." },
    { y: 5.2, title: "Built to Scale", desc: "Docker architecture scales from 10 to 10,000 users with no cost increase." },
  ];

  props.forEach(p => {
    slide.addShape(pres.shapes.OVAL, { x: 0.4, y: p.y, w: 0.7, h: 0.7, fill: { color: "10B981" }, line: { color: "10B981", width: 0 } });
    slide.addText([
      { text: p.title, options: { bold: true, fontSize: 15, color: "0F172A", breakLine: true } },
      { text: p.desc, options: { fontSize: 12, color: "334155" } },
    ], { x: 1.3, y: p.y, w: 8.2, h: 0.85, fontFace: "Calibri", valign: "middle" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 25 — CLOSING
// ─────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: "0F172A" };

  slide.addShape(pres.shapes.OVAL, { x: 6.5, y: -0.5, w: 5, h: 5, fill: { color: "10B981", transparency: 85 }, line: { color: "10B981", width: 0 } });
  slide.addShape(pres.shapes.OVAL, { x: -0.5, y: 5, w: 3, h: 3, fill: { color: "10B981", transparency: 85 }, line: { color: "10B981", width: 0 } });

  slide.addText("StorePrint", { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  slide.addText("One Platform. Complete Store Control.", { x: 0.5, y: 3.1, w: 9, h: 0.7, fontSize: 24, color: "10B981", fontFace: "Calibri" });

  const actions = [
    "Request a Demo",
    "Review Technical Documentation",
    "Start Pilot Deployment",
  ];
  actions.forEach((a, i) => {
    slide.addText(a, { x: 1.0, y: 4.2 + i * 0.55, w: 8, h: 0.45, fontSize: 18, color: "FFFFFF", fontFace: "Calibri" });
  });

  slide.addText("Built for brands that demand excellence", { x: 0.5, y: 6.6, w: 9, h: 0.5, fontSize: 14, italic: true, color: "94A3B8", fontFace: "Calibri" });
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "C:/GIT_TOP/StorePrint/StorePrint_Presentation.pptx" })
  .then(() => console.log("Saved: C:/GIT_TOP/StorePrint/StorePrint_Presentation.pptx"))
  .catch(err => { console.error("Error:", err); process.exit(1); });
