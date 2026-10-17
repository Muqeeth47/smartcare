# SmartCare — Project Architecture & Context

> Last updated: 2026-10-17 (navigation, login security, booking and donations pass)  
> Active Git Branch: `sudophiles` (`Muqeeth47/smartcare`)  
> Production Live URL: [https://smartcare-omega-two.vercel.app](https://smartcare-omega-two.vercel.app)  
> Firebase Project: `studio-5671575350-61bbd` (Google Cloud / Firestore deployed)

---

## 1. Project Overview

SmartCare is a high-reliability, production-grade digital public health and emergency supply chain resilience platform built for India's healthcare infrastructure. It integrates patient access, hospital outpatient department (OPD) queueing, real camera QR code medical triage, electronic prescriptions, and **AushadhiNet**—a federated medicine supply chain and shortage redistribution mesh.

### Core Modules
1. **Module 1: Clinical Operations & Digital Public Health**
   - OPD Queue management with dynamic emergency triage (Red / Yellow / Green).
   - Real-time device camera QR ticket & Medical Passport scanner powered by `jsQR`.
   - **Real Government Hospital Network & Live GIS Mapping**:
     - Verified real government and tertiary facilities: Osmania General Hospital (lead/default), Gandhi Hospital & Medical College, NIMS, Niloufer Hospital, Sarojini Devi Eye Hospital, Government Maternity Hospital (Sultan Bazar), Government ENT Hospital (Koti), District Area Hospital Kondapur, UPHC Khairatabad, and CHC Golconda.
     - Live OpenStreetMap Overpass API integration querying real hospitals and clinics within dynamic search radii (6km–30km) with automatic timeout protection.
     - Nominatim forward geocoding (searching localities/PIN codes) and reverse geocoding on GPS auto-detect, calculating straight-line Haversine distance and linking Google Maps turn-by-turn navigation.
     - Universal demo clinician binding: The complete roster of demo clinicians (`CARE_TEAM`) is seamlessly linked to whichever real hospital is chosen.
   - Multi-step appointment booking wizard with interactive Leaflet GIS facility mapping.
   - Emergency ambulance dispatch (ALS, BLS, Patient Transport) with real-time GPS ETA tracking.
   - Digital e-Prescriptions with bio-equivalent generic Jan Aushadhi (PMBJP) drug price comparison.
   - Verified digital Medical Passport (`SC-PASSPORT-8924`) with emergency allergies, critical conditions, and crisis protocols.
   - Exportable downloadable PDF medical reports and printable appointment boarding slips (`@media print` formatted).
   - Open-source blood bank and organ donation directory with geographic radius search.

2. **Module 2: AushadhiNet Federated Supply Chain & Shortage Mesh**
   - **Doctor & PHC Stock Register**: Real-time inventory register, daily consumption rate monitoring, days-of-stock calculation ($D = \lfloor \text{Stock} / \text{DailyRate} \rfloor$), and emergency SOS shortage reporting.
   - **Inward Dispatch Verification**: 6-digit OTP secure handover verification atomically debiting central warehouse reserves and crediting hospital inventory.
   - **State Command Center**: Real-time telemetry aggregating ICU beds, oxygen cylinders, cold chain vaccines, and facility stock levels across districts.
   - **Automated Rebalancing Engine**: Greedy allocation algorithm prioritizing critical facilities:
     $$P = \frac{10}{D + 0.1} - 0.05 \times \text{DistanceKm}$$
   - **Medicine Shortage Heat Map**: Interactive GIS spatial telemetry node view and facility $\times$ medicine stock intensity matrix.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components + Client Boundary Streaming)
- **Language**: TypeScript 5 (Strict type checking, zero `any`, zero compile errors)
- **Styling**: Tailwind CSS 3.4 + CSS Custom Properties (Theme tokens in `globals.css`)
- **State Management**: Zustand 4.5 (`useAppStore`, `usePatient`, `useDoctor`, `usePharmacy`, `useAmbulance`, `useSupply`) with localStorage persistence
- **Icons**: Lucide React (Strict zero-emoji policy throughout UI)
- **QR Scanner**: `jsQR` with HTML5 Video MediaDevices stream & fallback canvas decoder
- **Mapping**: Leaflet.js & OpenStreetMap (Dynamically imported client-only)
- **Database / Cloud**: Firebase Firestore SDK v10 (deployed rules on `studio-5671575350-61bbd`)
- **Hosting**: Vercel Serverless Platform (`apps/web` root directory)

---

## 3. Deployment & Cloud Infrastructure

### Vercel Production
- **Production Alias**: [https://smartcare-omega-two.vercel.app](https://smartcare-omega-two.vercel.app)
- **Project Name**: `smartcare` (Team: `abdul-muqeeths-projects`)
- **Root Directory**: `apps/web`
- **Framework Preset**: `nextjs`
- **Deployment Command**:
  ```bash
  cd "c:\Users\basit\Dropbox\My PC (LAPTOP-L7PDQOB1)\Downloads\Code\smartcare ts"
  vercel --prod --yes
  ```

### Firebase Firestore CLI
- **Account**: `muqeethshaikabdul@gmail.com`
- **Project ID**: `studio-5671575350-61bbd`
- **Configuration Files**:
  - `firebase.json` (Firestore rules pointer)
  - `.firebaserc` (Default project alias)
  - `firestore.rules` (Security rules enforcing read/write restrictions)
  - `apps/web/lib/firebase.ts` (Firebase app and Firestore client initialization)
- **Rules Deploy Command**:
  ```bash
  firebase deploy --only firestore:rules --project studio-5671575350-61bbd
  ```

---

## 4. Route Architecture (All 33 Next.js Routes)

| Route | View Component | Access Role | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Platform overview, live facility telemetry cards, service entry points |
| `/login` | `LoginPage` / `MorphingAuthCard` | Public | Morphing sign-in / sign-up card (4 roles), mobile-first, bot-guarded, `noindex`. Spec: `U/UIskeleton/loginpage.md` |
| `/dashboard/patient` | `PatientDashboardPage` | Patient | Active appointments, health passport summary, emergency shortcuts |
| `/dashboard/patient/apply/[step]` | `BookingWizard` | Patient | Multi-step booking (1: Reason, 2: Real Hospital Map & OSM Overpass, 3: Demo Clinician Slot, 4: Pass & Payment) |
| `/dashboard/patient/visits` | `PatientVisitsPage` | Patient | Digital OPD tokens, printable visit slip modal with QR code |
| `/dashboard/patient/history` | `MedicalHistoryPage` | Patient | Medical Passport, allergies, conditions, and exportable QR passport |
| `/dashboard/patient/donations` | `PatientDonationsFinder` | Patient | Live Leaflet map, GPS proximity blood bank & organ registry finder |
| `/dashboard/hospital` | `HospitalWorkspacePage` | Doctor / PHC | OPD triage queue, vitals recorder, electronic prescription builder |
| `/dashboard/queue` | `QueueWorkspacePage` | Doctor / Staff | Fullscreen OPD queue workstation with QR ticket search & triage sorting |
| `/dashboard/hospital/donations` | `DonationsPage` | Hospital | Hospital blood & organ supply publishing and community matching desk |
| `/dashboard/admin?adminTab=command&commandTab=<id>` | `AdminWorkspacePage` → `StateCommandSupplyModule` | Admin / CMO | State command pages, one per sidebar item: `summary`, `telemetry`, `heatmap`, `forecasting`, `redistribution`, `federated`, `manifest`, `escalation` |
| `/dashboard/admin?adminTab=operations` | `AdminWorkspacePage` | Admin / CMO | Rooms & walk-ins |
| `/dashboard/hospital?module=supply&supplyTab=<id>` | `HospitalSupplyModule` | Doctor / PHC | `inventory`, `shortage`, `inward`, `resources` (one per sidebar item) |
| `/dashboard/ambulance`, `/dashboard/pharmacy`, `/dashboard/verify-rx`, `/dashboard/patient/pharmacy`, `/dashboard/patient/profile` | Workspace versions of the public pages | Signed in | Keep the sidebar, menu and bottom bar. The public `/ambulance`, `/pharmacy`, `/verify-rx` stay for visitors |
| `/dashboard/admin/donations` | `DonationsPage` | Admin / CMO | Administrative donor registry and hospital inventory network |
| `/dashboard/analytics` | `AnalyticsDashboardPage` | Admin / CMO | Triage breakdown, wait times, department load, and CSV export |
| `/pharmacy` | `PharmacyPage` | Public / Patient | Jan Aushadhi PMBJP drug formulary, cart, counter #02 & delivery ordering |
| `/ambulance` | `AmbulancePage` | Emergency | One-touch 108 dispatch, ALS/BLS vehicle selector, and live GPS simulation |
| `/verify-rx` | `VerifyRxPage` | Pharmacist | Cryptographic prescription verification, doctor credentials, dispensing lock |
| `/donate` | `DonationFinderPage` | Public | Blood bank directory (8 blood groups) & organ donor pledge form |
| `/about`, `/terms`, `/privacy` | `InfoPage` | Public | Institutional governance, Ayushman Bharat compliance, privacy policies |
| `/slides` | `SlidesPresentationPage` | Public | High-resolution 16:9 executive presentation deck & printable PDF report |

---

## 5. UI Ergonomics & Mobile Responsiveness Standards

1. **Mobile Viewport Optimization (320px, 360px, 390px, 430px)**:
   - Automated crawler verified across all 33 routes with **0px horizontal document overflow** (`maxScroll === clientWidth`).
   - Role selectors on `/login` use a 2-column layout (`grid-cols-2`) ensuring full text visibility for:
     - `Doctor / PHC`
     - `District CMO`
     - `State Command`
     - `Patient`
   - State Command epidemic factor dropdown and facility switchers constrained with `w-full max-w-full sm:max-w-[280px] truncate`.
   - `.room-grid` responsive single-column layout on viewports $< 640\text{px}$, eliminating room-item card overflow.
   - Floating header/dock collision prevention on `/slides` with compact mobile actions and responsive margins.
   - Workspace topbar horizontal padding adaptive to ultra-narrow $320\text{px}$ viewports.

2. **Clean Minimalist Aesthetic**:
   - Redundant rectangular pill badges removed across headers and tabs for a crisp, space-efficient interface.
   - Header paddings and margins compacted (`text-xl sm:text-2xl font-bold`, tight metadata rows).

3. **Pagination Across High-Volume Lists**:
   - **Hospital Stock Register**: 6 items per page with Previous/Next controls and page counter.
   - **State Command District Matrix**: 6 facilities per page with Previous/Next controls.
   - **Logistics Transit Manifest**: 5 shipments per page with Previous/Next controls.
   - **OPD Queue Workspace**: 6 patients per page with Previous/Next controls.
   - **Jan Aushadhi Pharmacy Formulary**: 4 medicines per page with live search/category pagination reset.

4. **Strict Touch Target Compliance**:
   - All interactive controls $\ge 44\text{px}$ on tablet, $\ge 48\text{px}$ on mobile.
   - Bottom-sheet drawers and modals with reverse button stacking on mobile screens.

5. **Zero-Emoji Policy**:
   - All UI graphics and indicators exclusively utilize Lucide React icons.

6. **Medical Chips & Clinical Form Controls**:
   - **Symptom Picker & Reason for Visit**: Replaced browser-default unstyled HTML form controls with interactive medical chips/pills (`.symptom-suggestion` / `.symptom-picker`) featuring clean unselected states (`bg-slate-100`, border) and active states (`bg-[#0f5ca8]`, white text, `Check` icon).
   - **Review Modal & Boarding Pass Symptoms**: Parsed semicolon-separated symptom strings into individual rounded clinical badges (`.symptom-review-badge`) with dark-mode support and custom notes blocks.
   - **Modal Opacity Assurance**: Enforced opaque background styles (`var(--surface, #ffffff)` / dark mode `#0e1724`) and high z-index depth to prevent any modal transparency.

7. **One Navigation, No Duplicates** (`lib/nav-sections.ts`):
   - Every in-page section (State command, Doctor supply desk, Rooms & walk-ins) is defined once with a plain-language name, a short bottom-bar name, a one-line description and an icon. The sidebar, mobile drawer, mobile bottom bar and each page heading all read from that list.
   - The old sticky 8-tab strip on the State Command page, the Command / Rooms switcher on the admin page and the 4-tab strip on the doctor's supply page were removed. Each page now opens with a heading that says where you are; moving around is done from the sidebar (desktop) or the menu drawer and bottom bar (phone).
   - Plain names: Overview, Beds & Staff, Shortage Map, Demand Forecast, Move Stock, Other States, Deliveries, Emergency Orders, Rooms & Walk-ins; and for doctors Medicine Stock, Report a Shortage, Incoming Deliveries, Beds & Staff.
   - A missing `commandTab` / `supplyTab` / `module` in the address counts as the default page, in the sidebar highlight, the bottom bar and the page itself. An unknown value falls back to the default instead of showing a blank page.
   - Every destination is in the sidebar for each role: Donations, Pharmacy Orders, Ambulance (SOS) and Queue Workspace were added where they were only reachable from elsewhere.

8. **Phone Layout Fixes**:
   - District medicine table becomes one card per medicine below 768px (no sideways scrolling); the 6 district numbers show only on Overview and use real totals from the facility data (beds, ICU, oxygen) instead of hard-coded text.
   - The 15-minute update timer and outbreak scenario picker appear only on Overview, Beds & Staff and Demand Forecast.
   - Selects and filters are 44px tall with 16px text on phones.
   - There is now exactly one bottom bar (`MobileBottomNav`). A second global `BottomNav` used to render on top of it and was removed. Active state on staff tabs now follows `commandTab`.

9. **Booking Wizard** (`BookingWizard.tsx`):
   - Finished steps in the stepper are buttons: from step 2 or 3 you can jump back to Profile / Find care and change an answer. After the visit is booked (step 4) the stepper is read-only, because going back would book it twice.
   - `ChunkReload` reloads the page once if a new version was deployed while the tab was open (old files return 404, which showed as plain unstyled HTML).

10. **Doctor-Side Appointment Times**: the queue workspace shows `Appointment: Today, 4:30 pm` and `Booked: 17 Oct, 2:40 pm` on every patient; the Hospital workspace table has an Appointment column. Helpers `formatAppointmentTime` and `formatBookedAt` are in `lib/utils.ts`.

11. **Donations Page** (`PatientDonationsFinder.tsx`, logic in `lib/donation-logic.ts`):
    - Distances are measured (straight line) from the person's location, or central Hyderabad until they share it; centres are listed nearest first with an Open now / Closed now badge worked out from their opening hours, and a real `tel:` link.
    - "Find nearest..." looks up the typed area (Nominatim), moves the map and names the nearest centre. The box shows a place name, never raw coordinates.
    - Community list is matched to the blood group chosen: "I want to give" shows people asking for blood that group can give; "I need a donation" shows donors whose blood that group can receive (standard red-cell compatibility). Your own posts are kept separate.
    - Request forms ask how urgent it is; fields are 16px on phones; contact window no longer says "Verified".

12. **Google Translate** (`lib/translate.ts`, `components/ui/TranslateBootstrap.tsx`): the page never loaded Google's script before, so the language picker only set a cookie. It now loads the free website translator when a language other than English is picked (or was picked earlier), hides Google's toolbar, guards React against the DOM edits the translator makes, and switches back to English by clearing the cookie and reloading.

13. **Consistent Routing**: inside the dashboard the SOS button (top bar, bottom bar, patient overview) opens `/dashboard/ambulance`; public pages keep `/ambulance`. Patient "Profile" opens `/dashboard/patient/profile`. Page titles no longer repeat "| SmartCare" (the site template adds it once; the landing page uses an absolute title).

14. **Phone Audit Fixes (320 / 360 / 390 / 430px)**: every route and the main popups were checked at all four widths; none overflowed sideways, and these layout problems were fixed:
    - Wide tables became one card per row below 768px: doctor patient queue and released slots (`HospitalWorkspacePage.tsx`, shared `renderQueueActions`), State Command telemetry packets and demand forecast, Rooms & Walk-ins queue, and the medication list in the patient's demo-record popup (below 480px).
    - Rows that pushed past their box now wrap or shrink: booking review popup symptoms header, doctor QR-scan code row, pharmacy order-summary rows.
    - Chip and tab strips wrap on phones instead of hiding behind a sideways scroll (State Command, Shortage Map, Medicine Stock, Pharmacy, Analytics tabs as a 2-by-2 grid, medical-record editor tabs as a 3-column grid).
    - Touch targets are 44px on phones: top bar buttons and logo, language picker, `.btn-compact` buttons, pharmacy paging and remove buttons, Medical History remove buttons, queue row icons, slides controls, Donate "Reset view".
    - Text below 10px raised to at least 11px; popup footer stays pinned in the demo-record popup; `/slides` and the 404 page now have correct titles.

---

## 6. Demo Accounts (4-Tier Public Health Logins)

| Role | Email | Password | Scope & Primary Workspaces |
|---|---|---|---|
| **Patient / Citizen** | `patient@smartcare.demo` | `demo1234` | Appointment booking, live queue ticket, pharmacy orders, ambulance |
| **Doctor / PHC Officer** | `hospital@smartcare.demo` | `demo1234` | OPD triage desk, vitals capture, e-Rx studio, PHC stock register & SOS |
| **District CMO** | `cmo@district.gov.in` | `demo1234` | District inventory replenishment, facility shortages, redistribution approval |
| **State Commander** | `commander@mohfw.gov.in` | `demo1234` | Inter-district supply mesh, state shortage heat map, federated surge forecasting |

The login form fills these in for presentations, but only after the page has loaded in a browser (never in the server HTML) and never shows them as text. Set `NEXT_PUBLIC_DEMO_AUTOFILL=false` to turn the autofill off on a live site.

---

## 7. Development & Verification Commands

```bash
# Navigate to web application directory
cd apps/web

# Start Next.js local development server (http://localhost:3000)
npm run dev

# Run TypeScript typecheck without emitting files
npx tsc --noEmit

# List unused imports and variables (should print nothing)
npx tsc --noEmit --noUnusedLocals --noUnusedParameters

# Production Next.js build
npm run build

# Deploy to Vercel Production
vercel --prod --yes

# Deploy Firestore Security Rules
firebase deploy --only firestore:rules --project studio-5671575350-61bbd
```

---

## 8. Strategic Improvement Vectors (Code, Logic & UX)

> Status: still open. Nothing in this section was built in the 2026-10-17 pass (see sections 5.7 to 5.13 and 9 for what was). Closest partial items: the Overpass query cache (A.2) and the mobile sticky action bar (C.4) have not been started.

### A. Code & Architectural Health
1. **Zustand Slice Modularization**:
   - `apps/web/lib/store/app-store.ts` has grown large (~1,200 lines). Break monolithic store into typed slice domains (`patientSlice`, `doctorSlice`, `supplySlice`, `triageSlice`) using Zustand's `StateCreator`.
2. **GIS Overpass Query Caching & Fallback**:
   - Cache live Overpass API spatial node queries in `sessionStorage` or IndexedDB with an LRU policy (TTL ~15 min) to prevent OSM rate limits (HTTP 429) and reduce mobile data consumption.
3. **Component Decomposition**:
   - `BookingWizard.tsx` (~2,300 lines) contains all 4 wizard steps, Leaflet map rendering, and 3 modals. Deconstruct into discrete step components (`FacilityPickerStep`, `SlotSelectionStep`, `SymptomPickerStep`, `ConfirmationPassStep`).
4. **Offline PWA Service Worker**:
   - Add service worker caching for critical crisis flows: Medical Passport (`SC-PASSPORT-8924`), emergency QR tickets, and offline Jan Aushadhi formulary search.

### B. Logic & Algorithmic Enhancements
1. **Dynamic Emergency Triage Scoring (EATS/ESI)**:
   - Upgrade mock triage into an interactive clinical scoring system (Emergency Severity Index 1–5 or Manchester Triage System) calculating Red/Yellow/Green priority dynamically based on vitals ($SpO_2 < 90\%$, Systolic $BP < 90$, Pulse $> 130$).
2. **Supply Chain Multi-Hop Redistribution Routing**:
   - Advance the single-pair rebalancing algorithm to multi-depot vehicle routing (Dijkstra/VRP) minimizing logistics transit fuel while satisfying critical stock thresholds across rural PHCs.
3. **Queue Wait-Time Predictive Estimation**:
   - Replace static time slots with moving-average doctor consultation velocity ($\text{WaitTime} = \text{QueueAhead} \times \bar{T}_{\text{consult}} - \Delta t_{\text{elapsed}}$).

### C. UI / UX Ergonomics & Accessibility
1. **WCAG 2.1 AA Screen Reader & Keyboard Flow**:
   - Add explicit focus-trap handling and `Esc` key bindings to all modals (`PrescriptionModal`, `BookingReviewModal`, `PaymentModal`).
2. **Skeleton Shimmer Loading States**:
   - Replace spinning indicators on hospital listings, GIS maps, and stock tables with pulse skeleton shimmers matching final layouts.
3. **Haptic & Toast Micro-Feedback**:
   - Provide tactile visual micro-feedback when copying booking tokens, scanning QRs, or toggling generic drug substitutions.
4. **Mobile Sticky Action Bar**:
   - On mobile viewports ($\le 480\text{px}$), pin the "Back" and "Next" flow action buttons to a bottom safe-area blur dock so users don't need to scroll to proceed.

---

## 9. Security & Anti-Scraping

Be clear about the limit: anything a browser can show, a determined person or a full browser script can read. These steps make casual and automated scraping hard and keep the sign-in screen from leaking information. They do not replace server-side authentication.

| Layer | What it does | Where |
|---|---|---|
| Bot gate | Returns 403 to requests with no user agent or a known script / scraper / headless-browser user agent on `/login` and `/dashboard/*` | `middleware.ts`, `lib/bot-guard.ts` |
| Rate limit | 240 requests per minute per address on those routes, then 429 with `Retry-After`. Counts live in each server instance's memory, so use a shared store (Upstash / Vercel KV) for strict limits | `lib/bot-guard.ts` |
| Page headers | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` (no embedding), `nosniff`, referrer and permissions policies, HSTS in production, no `X-Powered-By` | `next.config.mjs` |
| Private pages | `/login` and `/dashboard/*` send `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Cache-Control: no-store` | `next.config.mjs` |
| Crawler rules | `robots.txt` blocks `/dashboard`, `/login`, `/api` and known AI / data-collection crawlers | `app/robots.ts` |
| Form built in the browser | The sign-in form is created after the page loads, so a plain download of the page gets an empty shell | `MorphingAuthCard.tsx` |
| Bot traps on forms | Hidden honeypot field and a minimum time before a submit counts (900 ms) | `MorphingAuthCard.tsx` |
| Guess limiter | After 5 wrong sign-ins the form locks for 30 s, doubling each time up to 15 min; survives a refresh. Browser-side only, so the real limit must also live on the server that checks passwords | `features/auth/useLoginThrottle.ts` |
| Same answer every time | Wrong password, wrong role and unknown email all show one message; password reset says "if that email has an account..." | `MorphingAuthCard.tsx` |
| Copy guards | No right-click, drag or copy of page text on `/login` (typing and pasting in fields still work) | `features/auth/useAntiScrape.ts` |
| Nothing sensitive on screen | Fake ID badges, the preset-password line and the "256-bit TLS" claim were removed; demo autofill is switchable | `LoginPage.tsx` |

### Environment variables

| Variable | Default | Effect |
|---|---|---|
| `SMARTCARE_HARDEN` | off in dev, on in production | `1` turns the bot gate and rate limit on locally |
| `SMARTCARE_ALLOW_BOTS` | unset | `1` turns the bot gate and rate limit off (for example for uptime monitors) |
| `SMARTCARE_DEMO_MODE` | on | `false` sends signed-out visitors from `/dashboard/*` to `/login?next=...` instead of auto-picking a demo account |
| `NEXT_PUBLIC_DEMO_AUTOFILL` | on | `false` stops the login form pre-filling demo credentials |

### Known gaps (need a real backend)
- The role cookie (`smartcare_role`) is set in the browser and is not signed, so anyone can edit it. Real access control needs server-issued, signed sessions (Firebase Auth or similar) checked in middleware.
- Demo accounts and passwords live in client code (`demo-db.ts`); remove them before any real use.
- Rate limits and sign-in lockout must also run on the server.
