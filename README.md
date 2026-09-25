# SmartCare — Public Health & Supply Chain Resilience Platform

SmartCare is a production-grade digital public health platform designed for outpatient clinical workflows and emergency medical supply chain resilience across India's public healthcare infrastructure.

Live Production URL: [https://smartcare-omega-two.vercel.app](https://smartcare-omega-two.vercel.app)

---

## Key Features

- **Clinical OPD Operations**: Real-time queue management, emergency triage ranking (Red / Yellow / Green), and physical device camera QR ticket scanner.
- **AushadhiNet Supply Mesh**: Multi-tier pharmaceutical inventory tracking for Primary Health Centres (PHCs) and district hospitals, equipped with automated shortage detection and greedy buffer redistribution algorithms.
- **Interactive Shortage Heat Map**: Spatial GIS facility telemetry and medicine shortage matrix with Days-of-Stock indicators.
- **Jan Aushadhi Pharmacy**: Outpatient prescription formulary with Pradhan Mantri Bhartiya Janaushadhi Pariyojana generic savings calculator.
- **Emergency Ambulance Dispatch**: GPS vehicle tracking and priority routing for ALS, BLS, and patient transport units.
- **Digital Health Passport**: Verified medical profile (`SC-PASSPORT-8924`) with allergies, chronic conditions, and crisis protocols.

---

## 4-Tier Public Health Logins

Use any of the demo accounts below via the single-click Quick Login grid on the `/login` page:

| Role | Email | Password | Primary Workflow |
|---|---|---|---|
| **Patient / Citizen** | `patient@smartcare.demo` | `demo1234` | Appointment booking, queue ticket, Jan Aushadhi orders |
| **Doctor / PHC Officer** | `hospital@smartcare.demo` | `demo1234` | Clinical OPD queue, vitals recorder, PHC stock register |
| **District CMO** | `cmo@district.gov.in` | `demo1234` | District warehouse allocation, shortage approvals |
| **State Commander** | `commander@mohfw.gov.in` | `demo1234` | State command mesh, lack-of-medicine heat map |

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State**: Zustand with localStorage persistence
- **Icons**: Lucide React (Zero-emoji policy)
- **Scanning & Maps**: `jsQR`, Leaflet.js, OpenStreetMap
- **Cloud & Database**: Firebase Firestore (`studio-5671575350-61bbd`), Vercel Serverless

---

## Getting Started

```bash
# 1. Install dependencies
cd apps/web
npm install

# 2. Run local development server
npm run dev
# Open http://localhost:3000

# 3. Typecheck & build
npx tsc --noEmit
npm run build
```
