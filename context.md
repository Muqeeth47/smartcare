# SmartCare — Project Context

> Last updated: 2026-09-12
> Active commit: `e5ee9e7` (Muqeeth47/smartcare `sudophiles`)
> Module 2: AushadhiNet Federated Health Resource & Supply Chain Shortage Management integrated into Doctor and State Command Center workspaces.

---

## Repositories

| Folder | Stack | Remote | Notes |
|--------|-------|--------|-------|
| `Code/smartcare` | **Vanilla JS + CSS (Vite)** | Mohammed-Ashraf-Shaik/smart-care-app | Active dev folder |
| `Code/smartcare ts` | Next.js 14 + TypeScript | Muqeeth47/smartcare (`main`) | Production-ready Next.js stack |

**Rule:** "don't make too many commits" — batch all changes into one commit before pushing.

---

## Tech Stack (smartcare — this folder)

- **Bundler:** Vite (`pnpm run dev` → `http://localhost:5173`)
- **JS:** Vanilla ES modules (IIFE pattern, no frameworks)
- **CSS:** Single file `css/styles.css` (3 500+ lines, CSS custom properties)
- **Icons:** Lucide (CDN), rendered via `window.lucide.createIcons()`
- **Map:** Leaflet.js (loaded on-demand from CDN unpkg in patient donations view)
- **Auth/DB:** localStorage demo mode (`window.App.DB`), Supabase-ready
- **No React, No TypeScript, No Tailwind**

---

## Project Structure

```
smartcare/
├── index.html               # Entry point — loads all JS/CSS
├── 404.html                 # SPA fallback
├── favicon.svg
├── vite.config.js
├── package.json             # pnpm, vite scripts
├── css/
│   └── styles.css           # ALL styles — ~4200 lines
└── js/
    ├── main.js              # Bootstrap, imports all modules
    ├── core/
    │   ├── app.js           # Router, view renderer, SPA click handler
    │   ├── state.js         # Global store (subscribe/navigate/navigateTab)
    │   ├── ui.js            # Shared UI: topbarControls, toast, footer,
    │   │                    #   mobileBottomNav, syncMobileBottomNav,
    │   │                    #   modals (prescription, QR scanner, passport)
    │   └── config.js        # Supabase config flags
    ├── services/
    │   ├── db.js            # localStorage demo DB + Supabase adapter
    │   └── api.js           # API helpers
    └── views/
        ├── public/
        │   ├── landing.js        # Landing page (hero, trust, insights, CTA)
        │   ├── login.js          # Auth: patient / doctor / staff roles
        │   ├── donation.js       # PUBLIC donation finder (finder shell layout)
        │   ├── info.js           # About / Terms / Privacy
        │   └── not-found.js
        ├── patient/
        │   ├── patient-dashboard.js   # Patient overview (appointments, visits)
        │   ├── patient.js             # Patient appointment booking (multi-step)
        │   ├── patient-donations.js   # PATIENT donation finder (finder shell + Map)
        │   └── history.js             # Medical history / passport
        ├── doctor/
        │   ├── doctor.js              # Doctor/hospital dashboard
        │   ├── queue.js               # Queue management
        │   └── doctor-donations.js    # Doctor donations view
        └── admin/
            ├── staff.js               # Admin/ops dashboard
            └── analytics.js           # Analytics view
```

---

## Routing (`js/core/state.js` + `js/core/app.js`)

Routes map to `state.view` keys:

| URL Pattern | View key | Component |
|---|---|---|
| `/` | `landing` | `Views.Landing` |
| `/login` | `login` | `Views.Login` |
| `/donate` | `donations` | `Views.Donation` |
| `/about`, `/terms`, `/privacy` | `about/terms/privacy` | `Views.Info` |
| `/dashboard/patient` | `patientDashboard` | `Views.PatientDashboard` |
| `/dashboard/patient/apply/:step` | `patient` | `Views.Patient` |
| `/dashboard/patient/donations` | `patientDonations` | `Views.PatientDonations` |
| `/dashboard/patient/history` | `patientHistory` | `Views.PatientHistory` |
| `/dashboard/hospital` | `doctor` | `Views.Doctor` |
| `/dashboard/queue` | `queue` | `Views.Queue` |
| `/dashboard/analytics` | `analytics` | `Views.Analytics` |
| `/dashboard/admin` | `staff` | `Views.Staff` |

Navigation uses `window.App.Store.navigate(route)` — never `window.location.href`.

---

## Key Patterns

### View Module Pattern
```js
(function () {
    window.App.Views.MyView = function () {
        const container = document.createElement('div');
        container.innerHTML = `...`;
        bind();
        return container;          // returned to app.js which appends to #app
    };
})();
```

### Topbar
Every view must include:
```js
window.App.UI.topbarControls(isWorkspace)  // theme + lang + optional menu btn
window.App.UI.bindTopbarControls(container) // wires up theme/lang/sidebar toggle
```

### Mobile Bottom Nav
Workspace views call after render:
```js
window.App.UI.syncMobileBottomNav('patient' | 'doctor' | 'staff', state.route)
```

### Sidebar (workspace views only)
```js
const workspaceNav = document.createElement('nav');
workspaceNav.className = 'workspace-tabs';
workspaceNav.innerHTML = navHtml();           // inline nav links
workspaceMain.insertBefore(workspaceNav, workspaceMain.firstChild);
// bindTopbarControls() handles mobile drawer + desktop collapse
```

---

## Donation Views — Finder Shell Layout

Both donation views use the **`nd-finder-shell`** layout:

### Public: `/donate` → `js/views/public/donation.js`
- Left panel: Blood group grid (4×2) + city search + GPS locate + results list
- Right area: Styled map placeholder (no live map on public page)
- Tabs: Blood / Organ (pill switch)
- Mobile: **Map on top (42vh) · List scrolls below**

### Patient: `/dashboard/patient/donations` → `js/views/patient/patient-donations.js`
- Same finder-shell structure
- Left panel: Type tabs + Mode tabs (Give/Receive) + blood group grid + search + results + mini register form
- Right area: **Real Leaflet.js map** (OpenStreetMap, loaded from CDN on demand)
  - 5 demo centres pinned (Hyderabad lat/lng)
  - Clicking a result flies map to that pin
  - GPS locate button moves map to device position
- Mobile: **Map on top (38vh) · Panel scrolls below** — no toggle button
- Sidebar nav + mobile bottom bar retained from workspace shell

### CSS classes (all in `css/styles.css`)
| Prefix | Scope |
|--------|-------|
| `nd-*` | Shared finder shell (both donation views) |
| `pd-*` | Patient-donations-specific overrides |

---

## CSS Architecture (`css/styles.css`)

Sections (approximate line ranges):
- `1–100` — Reset, CSS custom properties
- `100–350` — Dark mode overrides
- `350–800` — Topbar, brand, shell, auth, workspace
- `800–1385` — Donation (legacy cards), flow-topbar, flow-card, auth layout
- `1385–1543` — Media queries: 900px / 760px / 700px / 640px / 560px / 520px
- `1543–1650` — Mobile bottom nav
- `1650–3510` — Components (queue, dashboard, charts, modals, prescription PDF, etc.)
- `3510–3857` — Finder shell (`nd-*` classes)
- `3858–3965` — Mobile breakpoints for finder shell
- `3965–4033` — Global mobile fixes (bottom nav clearance, toast positioning)
- `4033+` — Patient donations overrides (`pd-*` classes + mobile)

### CSS custom properties (`:root`)
```css
--ink: #12304f        /* Primary text */
--muted: #5d7188      /* Secondary text */
--line: #d8e4ef       /* Borders */
--surface: #ffffff    /* Cards, panels */
--canvas: #f5f8fb     /* Page background */
--teal: #0f5ca8       /* Primary brand / CTA */
--teal-dark: #0a3b69  /* Headings, hover */
--mint: #e5f1fc       /* Teal tint / hover bg */
--saffron: #dceeff    /* Light accent */
--shadow: ...
```

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `patient@smartcare.demo` | `demo1234` | Patient |
| `hospital@smartcare.demo` | `demo1234` | Doctor / Provider |
| `admin@smartcare.demo` | `demo1234` | Hospital Ops / Staff |

---

## TS Tech Stack Migration Status (`Code/smartcare ts`)

> Synchronised: 2026-09-09
> Status: 100% Visual Fidelity, Full Feature Parity & Production Build Clean

### Features Ported & Visually Upgraded:
- [x] **Queue Management Workspace** (`/dashboard/queue`):
  - Upgraded from bare HTML list to rich provider-tier workspace.
  - Full Provider Header with live count indicator badge.
  - 4 Provider Stat Cards: Waiting now, Priority cases, Average wait time, Queue status.
  - Queue Tools Bar: Live search filter, priority dropdown (Red/Yellow/Green), status dropdown, and refresh button.
  - Rich patient queue cards with triage badges, consultation time, doctor assignment, and status transition buttons (Call next, Start visit, Complete visit).
  - Modal for scanning / looking up Patient QR Tickets and Medical Passports (`SC-PASSPORT-8924`).
- [x] **Hospital & Admin Donations Workspace** (`/dashboard/hospital/donations`, `/dashboard/admin/donations`):
  - Upgraded from simple HTML wireframe to rich 2-column clinical operations workspace.
  - Category pill switcher: Blood bank (`Droplets`) vs Organ pool (`Activity`).
  - Hospital action mode: "We can offer (Stock)" vs "We need (Requirement)".
  - Interactive publishing form: Blood group / organ selector, unit counter, priority selector (Routine, Urgent, Emergency), and clinical consent.
  - Live matching panel: Community patient leads with one-click Contact trigger + Hospital network inventory & requests.
- [x] **Patient Visits & Printable Slip** (`/dashboard/patient/visits`):
  - Polished cards with healthcare centre badges, status indicators, and token references.
  - Interactive printable visit slip modal (`SmartCare Visit Slip`) with print/save PDF trigger.
- [x] **Multi-Step Appointment Booking** (`/dashboard/patient/apply/1-4`):
  - Step 1: Care profile & reason selection.
  - Step 2: Location search, auto-GPS, OpenStreetMap Leaflet interactive map with pins & km distances.
  - Step 3: Clinician & slot reservation, live ₹125 fee calculator, details confirmation modal.
  - Step 4: Digital Boarding Pass with tear line & notches, QR image, copyable token, and simulated payment gateway modal (`SmartCare Pay` with UPI/card/counter tabs and TXN receipt).
- [x] **Hospital Doctor Workspace** (`/dashboard/hospital`):
  - Patient queue, consultation status transitions, live vitals, prescription builder with printable Rx report.
  - Scan Patient QR modal + read-only Shared Medical Passport (`SC-PASSPORT-8924`).
- [x] **Admin Operations Workspace** (`/dashboard/admin`):
  - 4 provider stat cards, room status grid with 4 interactive toggleable rooms, today at a glance signal, live walk-in registration accordion.
- [x] **Queue Analytics** (`/dashboard/analytics`):
  - Departmental analytics, wait time metrics, triage distribution, and full CSV export engine.
- [x] **Open-Source Donation Finder Maps** (`/donate` & `/dashboard/patient/donations`):
  - Both public and authenticated patient views use live OpenStreetMap via Leaflet with 8 blood group buttons, GPS geolocation, and organ registry interest.
- [x] **Unified Responsive Navigation & Collapsible Sidebar**:
  - Desktop collapsible sidebar (230px) with auto-adjusting content padding.
  - Floating edge expand button + Topbar toggle button.
  - Mobile slide-out drawer with backdrop + 5-item mobile bottom navigation (`≤ 768px`) across all roles.
- [x] **Interactive Live Care Network Panel** (Landing hero):
  - Replaced static mini-map with two tappable hospital cards showing real-time wait times, ICU beds, and distance.
  - Clicking a card pre-selects the hospital and updates the "Book Visit" button URL directly into the booking flow.
  - Green/yellow wait badges, active selection highlight, and live queue indicator.
- [x] **CSS Variable Fixes & Dark Mode Tokens** (`globals.css`):
  - Fixed 43+ broken `var(--muted)` references that had no matching `:root` definition.
  - Added `--muted`, `--ink`, `--canvas` aliases in both light and dark theme tokens.
  - All landing page sections (`How it works`, `For providers`, `Trust row`, `Stat strip`) now use `var(--surface)` instead of hardcoded `#fff` / `bg-white`.
- [x] **Mobile Polish Standards** (Spec §5.1–5.3):
  - Safe-area bottom clearance for public flow shells: `padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px))`.
  - Modal mobile sizing: `max-width: min(94vw, 560px)`, `max-height: 88vh`, vertical scroll, button stack.
  - Touch targets: min 44px on tablet, 48px on mobile for buttons, inputs, selects.
- [x] **Clinical Vitals & Medical Passport in Doctor Workspace** (`/dashboard/hospital`):
  - 1-Click Medical Passport: Direct `Medical Passport` button on the consultation hero opening verified allergies (Penicillin warning), effective medications, care conditions, and emergency crisis protocols.
  - On-Duty Vitals Capture: Modal dialog allowing doctors to record BP (mmHg), Pulse (bpm), SpO2 (%), and Temp (°F), automatically appending to the patient's active prescription.
  - Dynamic Triage Adjuster: Inline dropdown in the doctor hero allowing instant re-classification (Red/Yellow/Green) which re-sorts queue rank immediately.
  - Trauma Bay Alert Response: Incoming trauma banner equipped with interactive `Prep Trauma Bay 01` action that alerts the resuscitation team and holds ICU bed capacity.
- [x] **Dynamic URL Synchronization for All Tabs & Filters**:
  - Every tabbed view synchronizes with URL query parameters via `useSearchParams` and `router.replace(..., { scroll: false })`:
    - Pharmacy: `?tab=patient|dispensary`
    - Public Donations: `?tab=blood|organ`
    - Patient Donations: `?type=blood|organ&mode=give|receive`
    - Hospital/Staff Donations: `?type=blood|organ&mode=offer|request`
    - Queue Workspace: `?priority=Red|Yellow|Green&status=waiting|called|in_progress|completed`
    - Analytics Dashboard: `?range=today|week|month`
    - Ambulance Dispatch: `?tier=ALS|BLS|PatientTransport`
    - Patient Medical History: `?modal=edit&tab=med|alg|cond|emg|provider` & `?modal=qr`
    - Patient Visits: `?visit=[id]`
    - Authentication: `?role=patient|doctor|staff&mode=signin|signup|recovery`
  - Suspense boundaries wrapping all Next.js App Router page routes for robust client streaming.
- [x] **High Mobile Ergonomics & Touch Standards**:
  - 44px–48px minimum touch targets across all interactive buttons, inputs, selects, and tab pills.
  - Modals feature bottom-sheet behavior on mobile (`rounded-t-3xl sm:rounded-2xl`, `max-h-[88vh]`, action buttons stacked in reverse order `flex flex-col-reverse sm:flex-row`).
  - Payment method tabs stack in 2 columns on $\le 480\text{px}$ viewports.
- [x] **Module 2: AushadhiNet Federated Supply Chain & Emergency Rebalancing**:
  - **Shared Data Contracts** (`packages/types`): `MedicineItem`, `HospitalSupplyProfile`, `DistrictSupplyAggregate`, `RedistributionOrder`, `ShortageReport`.
  - **Doctor / PHC Stock Register & SOS Shortage Desk** (`/dashboard/hospital?module=supply`):
    - Real-time stock audit with days remaining calculator ($D = \lfloor \text{Stock} / \text{DailyRate} \rfloor$).
    - Interactive stock edit bottom sheet with emergency shortage flagging dispatching immediate events to the district mesh.
    - Inward dispatch verification desk with 6-digit OTP verification: delivery debits the central warehouse and credits the recipient facility, automatically clearing resolved shortages.
  - **State Command Center & District Health Directorate** (`/dashboard/admin?adminTab=command`):
    - Aggregates clinical telemetry across 5 facilities in Hyderabad & Rangareddy Central.
    - Tracks district ICU bed capacity (41/50), oxygen cylinders (112/120), and cold-chain vaccine reserves.
    - Automated greedy redistribution engine prioritizing facilities by urgency score $P = \frac{10}{D + 0.1} - 0.05 \times \text{DistanceKm}$ and replenishing 7 days of safe buffer.
    - Dispatch and approval controls updating real-time manifest and transit tracking.
- [x] **Interactive Lack-of-Medicine Heat Map** (`MedicineShortageHeatMap.tsx`):
  - **Spatial GIS Telemetry Node View**: Displays GPS nodes for all facilities, distance vectors from Central Depot, severity ring indicators (Critical $\le 3\text{d}$ in red, Low in amber, Stable in emerald), and single-SKU filtering.
  - **Facility $\times$ Medicine Shortage Intensity Matrix**: Complete cross-tabular grid showing live stock units and days-remaining heat chips for all 10 essential medicines.
  - **Strict Zero-Emoji Policy**: Built 100% using Lucide icons (`Flame`, `AlertTriangle`, `TrendingDown`, `ShieldAlert`, `Pill`, `MapPin`, `Truck`, `Activity`, `Building2`, `Sparkles`, etc.).
- [x] **4 Authentic Indian Public Health Logins** (`/login`):
  - **Doctor & PHC Officer**: `hospital@smartcare.demo` (SmartCare Community Hospital) — Clinical OPD queue, triage adjustment, and PHC stock management.
  - **District CMO**: `cmo@district.gov.in` (Hyderabad District Health Directorate) — District warehouse replenishment, local PHC shortage aggregation, and rebalance approvals.
  - **State & National Commander**: `commander@mohfw.gov.in` (MoHFW State Control Desk) — Inter-district health mesh, state shortage heat map, and federated surge forecasting.
  - **Patient Portal**: `patient@smartcare.demo` (Citizen Access) — Live queue tracking, appointment booking, digital prescriptions, and emergency ambulance access.
  - 4-Tier Autofill Quick Access grid with responsive touch targets $\ge 48\text{px}$.
- [x] **Mathematical Algorithms Implemented**:
  - **Haversine Distance**: $d = 2R \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos\phi_1\cos\phi_2\sin^2(\Delta\lambda/2)}\right)$ calculated between facility coordinates.
  - **Rebalance Buffer Optimization**: $Q = \max(\text{Buffer} \times 2, \text{DailyRate} \times 7 - \text{CurrentStock})$ capped by warehouse surplus.
  - **Two-Way Inventory Ledger Accounting**: Atomic debit of source warehouse inventory and credit of recipient hospital inventory upon OTP handover verification.
- [x] **Build Verification**:
  - Zero TypeScript compile errors (`npx tsc --noEmit` exit code 0).
  - Clean build without warnings.

---

## Dev Commands

```bash
# Next.js Stack (smartcare ts)
cd apps/web
npm run dev          # → http://localhost:3000
npm run build        # Production build verification

# Vanilla Stack (smartcare folder)
pnpm run dev          # → http://localhost:5173
```

