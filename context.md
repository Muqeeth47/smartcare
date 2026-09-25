# SmartCare — Project Architecture & Context

> Last updated: 2026-09-25  
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
   - Multi-step appointment booking wizard with interactive Leaflet GIS facility mapping.
   - Emergency ambulance dispatch (ALS, BLS, Patient Transport) with real-time GPS ETA tracking.
   - Digital e-Prescriptions with bio-equivalent generic Jan Aushadhi (PMBJP) drug price comparison.
   - Verified digital Medical Passport (`SC-PASSPORT-8924`) with emergency allergies, critical conditions, and crisis protocols.
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

## 4. Route Architecture (All 32 Next.js Routes)

| Route | View Component | Access Role | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Platform overview, live facility telemetry cards, service entry points |
| `/login` | `LoginPage` | Public | 4-tier authenticated login with single-click demo autofills |
| `/dashboard/patient` | `PatientDashboardPage` | Patient | Active appointments, health passport summary, emergency shortcuts |
| `/dashboard/patient/apply/[step]` | `BookingWizard` | Patient | Multi-step booking (1: Reason, 2: Hospital Map, 3: Doctor Slot, 4: Pass) |
| `/dashboard/patient/visits` | `PatientVisitsPage` | Patient | Digital OPD tokens, printable visit slip modal with QR code |
| `/dashboard/patient/history` | `MedicalHistoryPage` | Patient | Medical Passport, allergies, conditions, and exportable QR passport |
| `/dashboard/patient/donations` | `PatientDonationsFinder` | Patient | Live Leaflet map, GPS proximity blood bank & organ registry finder |
| `/dashboard/hospital` | `HospitalWorkspacePage` | Doctor / PHC | OPD triage queue, vitals recorder, electronic prescription builder |
| `/dashboard/queue` | `QueueWorkspacePage` | Doctor / Staff | Fullscreen OPD queue workstation with QR ticket search & triage sorting |
| `/dashboard/hospital/donations` | `DonationsPage` | Hospital | Hospital blood & organ supply publishing and community matching desk |
| `/dashboard/admin` | `AdminWorkspacePage` | Admin / CMO | Facility operations, doctor room allocation, walk-in registration |
| `/dashboard/admin/donations` | `DonationsPage` | Admin / CMO | Administrative donor registry and hospital inventory network |
| `/dashboard/analytics` | `AnalyticsDashboardPage` | Admin / CMO | Triage breakdown, wait times, department load, and CSV export |
| `/pharmacy` | `PharmacyPage` | Public / Patient | Jan Aushadhi PMBJP drug formulary, cart, counter #02 & delivery ordering |
| `/ambulance` | `AmbulancePage` | Emergency | One-touch 108 dispatch, ALS/BLS vehicle selector, and live GPS simulation |
| `/verify-rx` | `VerifyRxPage` | Pharmacist | Cryptographic prescription verification, doctor credentials, dispensing lock |
| `/donate` | `DonationFinderPage` | Public | Blood bank directory (8 blood groups) & organ donor pledge form |
| `/about`, `/terms`, `/privacy` | `InfoPage` | Public | Institutional governance, Ayushman Bharat compliance, privacy policies |

---

## 5. UI Ergonomics & Compact Standards

1. **Clean Minimalist Aesthetic**:
   - Redundant rectangular pill badges (e.g. `MoHFW • NITI Aayog Health Mesh`, `Live Federated Sync`) removed across headers and tabs for a crisp, space-efficient interface.
   - Header paddings and margins compacted (`text-xl sm:text-2xl font-bold`, tight metadata rows).
2. **Pagination Across High-Volume Lists**:
   - **Hospital Stock Register**: 6 items per page with Previous/Next controls and page counter.
   - **State Command District Matrix**: 6 facilities per page with Previous/Next controls.
   - **Logistics Transit Manifest**: 5 shipments per page with Previous/Next controls.
   - **OPD Queue Workspace**: 6 patients per page with Previous/Next controls.
   - **Jan Aushadhi Pharmacy Formulary**: 4 medicines per page with live search/category pagination reset.
3. **Strict Touch Target Compliance**:
   - All interactive controls $\ge 44\text{px}$ on tablet, $\ge 48\text{px}$ on mobile.
   - Bottom-sheet drawers and modals with reverse button stacking on mobile screens.
4. **Zero-Emoji Policy**:
   - All UI graphics and indicators exclusively utilize Lucide React icons.

---

## 6. Demo Accounts (4-Tier Public Health Logins)

| Role | Email | Password | Scope & Primary Workspaces |
|---|---|---|---|
| **Patient / Citizen** | `patient@smartcare.demo` | `demo1234` | Appointment booking, live queue ticket, pharmacy orders, ambulance |
| **Doctor / PHC Officer** | `hospital@smartcare.demo` | `demo1234` | OPD triage desk, vitals capture, e-Rx studio, PHC stock register & SOS |
| **District CMO** | `cmo@district.gov.in` | `demo1234` | District inventory replenishment, facility shortages, redistribution approval |
| **State Commander** | `commander@mohfw.gov.in` | `demo1234` | Inter-district supply mesh, state shortage heat map, federated surge forecasting |

---

## 7. Development & Verification Commands

```bash
# Navigate to web application directory
cd apps/web

# Start Next.js local development server (http://localhost:3000)
npm run dev

# Run TypeScript typecheck without emitting files
npx tsc --noEmit

# Production Next.js build
npm run build

# Deploy to Vercel Production
vercel --prod --yes

# Deploy Firestore Security Rules
firebase deploy --only firestore:rules --project studio-5671575350-61bbd
```
