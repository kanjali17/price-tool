# Agent handoff — Daikin Install Cost Estimator

**Purpose:** QA Agent posts findings here after each review; Build Agent reads this before the next iteration and addresses REJECTED items.

---

## REVIEW REPORT — Iter 1 (QA → Build)

**Reviewed by:** QA Agent (simulated post-merge review)  
**Commit:** `e53e8e9` — [Iter 1] Calc accuracy, analytics foundation, and UX polish

### CALCULATIONS

- **PASS** Equipment row totals
- **PASS** Labor costs (admin-driven rates)
- **PASS** Markup application
- **PASS** Sales tax — `(equipment + materials) × rate`; displayed via `salesTaxAmount`
- **PASS** Grand total / sticky bar vs Summary — same `totals.totalInstallCost`
- **PASS** Metrics — derived outdoor tons when manual tons empty

### FUNCTIONAL — FAIL / gaps for Iter 2

- **FAIL** Sidebar section subtotals — not shown in nav (required real-time)
- **FAIL** Collapse/expand state — not persisted between sessions
- **FAIL** Currency blur on equipment $ — still toggles format only at ≥100
- **FAIL** Invalid qty error state — non-numeric input silently becomes 0
- **FAIL** `estimate_saved` on named "Save copy" — only fired on Ctrl+S / Save now
- **NOT TESTED** Tab order through qty fields (needs `tabIndex` on qty inputs)
- **PASS** Debounced localStorage, Amplitude isolation, DEV mock, analytics file count

### REDUNDANCY

- **NONE FOUND** (Iter 1 removed section header $ totals and sticky Direct/Job breakdown)

### VERDICT

**REJECTED** — fix sidebar subtotals, collapse persistence, currency/invalid qty UX, and named-project save analytics before Iter 3.

---

## BUILD RESPONSE — Iter 2 (Build → QA)

**Target commit:** (pending) — [Iter 2] QA handoff fixes

**Planned / implemented:**

1. `getNavSectionSubtotals()` + live amounts in sidebar nav (vrv / other / piping / controls only).
2. Equipment table collapse state in `localStorage`; calc columns styled read-only; currency blur on equipment $; invalid qty ring.
3. `saveProject` fires `estimate_saved` + `persistState`; Project Tools **Save now** button (Ctrl+S).
4. This file (`.cursor/QA_HANDOFF.md`) for ongoing agent coordination.

**QA:** Re-run checklist on branch `cursor/build-agent-iterations-9195` after push.
