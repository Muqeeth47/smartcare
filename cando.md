# SmartCare — Can Do / Feature Roadmap

> Ideas, improvements, and planned features. Prioritised roughly: 🔴 High impact · 🟡 Medium · 🟢 Nice to have

---

## 🔐 Auth & Identity

### Separate Doctor vs Hospital Admin Login 🔴
**Current problem:** Both `hospital@smartcare.demo` and `admin@smartcare.demo` are vague — one person plays both roles.

**What to build:**
- Doctor login → goes to clinical workspace (patient queue, prescriptions, consultations)
- Hospital Admin login → goes to operations workspace (staff, beds, analytics, billing)
- They are different roles with different permissions
- A doctor can be linked to one or more hospitals
- A hospital can have many doctors

```
Roles:
  patient     → /dashboard/patient
  doctor      → /dashboard/doctor (clinical)
  hospital    → /dashboard/admin  (operations)
  superadmin  → /dashboard/super  (platform-wide)
```

---

### Doctor Verification via ABDM HPR API 🔴
**Current problem:** Anyone can sign up as a "doctor" — zero verification.

**The flow to build:**
```
Doctor registers →
  Option A: Enter HPR ID (Ayushman Bharat Health Professional Registry)
    → Backend calls ABDM HPR API automatically
    → Returns: name, specialisation, reg no., council, status: ACTIVE/SUSPENDED
    → If ACTIVE → instantly verified, account unlocked
    → If SUSPENDED/EXPIRED → rejected with reason

  Option B: Enter NMC Registration Number (manual fallback)
    → Backend pre-fills name + council from NMC search
    → Admin sees comparison view (entered vs NMC data)
    → Admin one-click verify/reject
    → Doctor gets email with decision
```

**Why ABDM over manual NMC:**
- ABDM HPR API is government-backed, REST + OAuth, free sandbox
- NMC has no public API — scraping is fragile and against ToS
- ABDM adoption is growing — eventually replaces manual entirely
- Legally defensible for liability purposes

**API:** `hpr.abdm.gov.in` (sandbox available for dev)

---

### OTP / Passwordless Login 🟡
- Patient logs in with phone number → OTP via SMS (Twilio / AWS SNS / MSG91)
- No passwords to forget or breach
- More appropriate for patients than email+password
- Doctors keep email+password (professional accounts)

---

### ABHA Number Integration 🟡
- Ayushman Bharat Health Account (ABHA) — India's national health ID
- Patients link their ABHA number → medical records are portable across hospitals
- API available via ABDM sandbox
- Major differentiator vs competitors

---

## 👤 Patient Features

### Real Appointment Time Slots 🔴
**Current:** Patient fills a form, no actual time slot selected.

**What to build:**
- Doctor publishes available slots (e.g. Mon/Wed/Fri 10am–1pm, 4 slots/hour)
- Patient sees real calendar and picks a slot
- Slot is locked on booking, released on cancellation
- Doctor sees day-view of booked appointments

---

### SMS / Push Notifications for Queue 🔴
- "You are #4 in queue — estimated wait: 20 mins"
- "Your turn is next — please proceed to OPD Room 2"
- "Your appointment with Dr. Sharma is confirmed for 10:30am"
- **Tech:** Twilio SMS, Firebase Cloud Messaging (PWA push), or WhatsApp Business API

---

### Telemedicine / Video Consult Link 🟡
- Doctor generates a one-time video call link (Daily.co / Jitsi / Whereby embed)
- Sent to patient via SMS/email
- Shows in patient dashboard as "Join consultation"
- No complex WebRTC setup — just embed an existing service

---

### Lab Report Upload & Storage 🟡
- Patient uploads PDF/image of lab reports
- Stored per-visit in medical history
- Doctor can view during consultation
- Linked to appointment reference

---

### Family Account / Dependants 🟡
- One account manages multiple family members
- Switch between profiles: "Booking for: Myself / Mother / Child"
- Each profile has separate medical history and appointments
- Common in Indian families — one person manages everyone's healthcare

---

### Medicine Reminders 🟢
- After prescription is issued, patient opts in to reminders
- Daily notification: "Time to take Metformin 500mg"
- PWA push notification or SMS
- Linked to prescription duration (auto-stops after 7 days if 7-day course)

---

## 🏥 Doctor / Hospital Features

### Doctor Availability Calendar 🔴
- Doctor sets weekly schedule: days, hours, max patients per slot
- Can mark leave/unavailable days
- Hospital admin can see all doctors' availability
- Foundation for real appointment booking

---

### Multi-Doctor Hospital Support 🔴
**Current:** One hospital → one doctor login.

**What to build:**
- Hospital creates an organisation account
- Invites doctors by email → they join the hospital
- Each doctor has their own login + patient list
- Hospital admin sees aggregate queue across all doctors
- Doctor sees only their own patients

---

### E-Prescription with Digital Signature 🟡
**Current:** Prescription is a demo PDF with no legal standing.

**To make it production-ready:**
- Doctor signs prescription using their registered credentials
- PDF is hash-signed (like a digital stamp)
- Patient can share the PDF and a pharmacy can verify authenticity via QR code
- Linked to doctor's NMC/HPR registration

---

### Consultation Notes / SOAP Format 🟡
- Structured clinical note per visit:
  - **S**ubjective: patient complaint
  - **O**bjective: vitals, observations
  - **A**ssessment: diagnosis
  - **P**lan: prescription, follow-up
- Standard format used in real hospitals
- Replaces the current free-text "symptoms" field

---

### Bed & Ward Management 🟢
- Track available beds per ward (General, ICU, Maternity, etc.)
- Admit patient from OPD queue to a bed
- Discharge tracking
- Useful for hospital ops admin dashboard

---

## 💉 Donation Features

### Real Blood Bank API Integration 🟡
**Current:** Demo centres hardcoded for Hyderabad.

- eRaktKosh (India's national blood bank software) has API access for states
- Returns real-time blood unit availability across registered blood banks
- Replace demo data with live data where available

---

### Organ Donation — NOTTO Integration 🟡
- NOTTO (National Organ & Tissue Transplant Organisation) has an API
- Registered interest can be formally submitted to NOTTO waitlist
- Currently: demo only, no real submission
- Would make the organ donation feature genuinely impactful

---

### Donor Matching Notifications 🟡
- Blood bank posts urgent request → matching registered donors get SMS
- "There is an urgent need for O+ blood near you — are you available?"
- Donor replies → connected to blood bank
- Similar to how real apps like DonateBlood work

---

## 📊 Analytics & Reporting

### Real-time Queue Analytics 🟡
- Average wait time trends by hour/day
- Doctor throughput (patients per hour)
- No-show rate tracking
- Peak load prediction (e.g. "Mondays are 40% busier")

### Revenue / Billing Report 🟢
- Total consultation fees collected per day/week/month
- Breakdown by doctor, department, payment method
- Export as CSV/PDF for hospital accounts

---

## ⚙️ Technical / Infrastructure

### Connect Real Supabase Backend 🔴
**Current:** Everything is `localStorage` demo mode.

- Auth: Supabase Auth (email OTP or phone)
- DB: Supabase Postgres (queue, appointments, prescriptions)
- Storage: Supabase Storage (uploaded documents, lab reports)
- Real-time: Supabase Realtime (live queue updates without polling)
- Config already exists in `js/core/config.js` — just needs real keys

---

### PWA (Progressive Web App) 🟡
- Installable on Android/iOS home screen — no app store needed
- Offline access to previously loaded data
- Push notifications via service worker
- `manifest.json` + `service-worker.js` → transforms the web app
- Zero extra cost, huge UX improvement for patients

---

### DISHA Act Compliance 🟡
- Digital Information Security in Healthcare Act (India)
- Health data must be encrypted, access-logged, and patient-consented
- Every record access logged with timestamp + user ID
- Patient can revoke data access
- Required if this ever goes to production

---

### Audit Trail 🟡
- Every action logged: who changed what, when
- "Dr. Sharma updated prescription for Asha Rao at 14:32"
- Stored in append-only log table in Supabase
- Viewable by hospital admin and superadmin

---

## 🎨 UX / Design

### Onboarding Flow for New Users 🟡
- First-time patient: guided tour of features (3-step overlay)
- First-time doctor: walk through setting up availability and profile
- Reduces confusion on first login

### Dark Mode Polish 🟢
- Several components have incomplete dark mode coverage
- Run through every screen in dark mode and fix gaps systematically

### Accessibility Audit 🟢
- Screen reader testing (NVDA / VoiceOver)
- Keyboard navigation for all interactive elements
- Color contrast check (WCAG AA minimum)
- Important for a healthcare product

---

## Priority Summary

| Priority | Feature |
|---|---|
| 🔴 Build next | Doctor verification (ABDM), Separate roles, Real Supabase, Time slots |
| 🟡 Build soon | OTP login, ABHA, SMS notifications, Multi-doctor hospitals, PWA |
| 🟢 Later | Bed management, Revenue reports, Dark mode audit, A11y audit |

---

> This file is for planning only. No production medical service is implied.
> For ABDM API sandbox: [sandbox.abdm.gov.in](https://sandbox.abdm.gov.in)
> For NMC registry: [nmc.org.in](https://www.nmc.org.in)
> For eRaktKosh: [eraktkosh.in](https://eraktkosh.in)
