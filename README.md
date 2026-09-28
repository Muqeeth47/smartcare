<div align="center">
  <img src="apps/web/public/logo.jpg" alt="Team sudophiles Logo" width="96" height="96" style="border-radius: 20px; object-fit: cover;" />
  <h1>SmartCare &amp; AushadhiNet Mesh</h1>
  <p><strong>A Federated AI Platform for National-Scale Health Resource &amp; Supply Chain Resilience</strong></p>
  <p><em>Built by Team <strong>sudophiles</strong> for the Google Cloud Hackathon — Build with AI: Code for Communities (Second Edition)</em></p>

  <p>
    <a href="https://smartcare-omega-two.vercel.app/"><strong>🌐 Live Prototype</strong></a> &bull;
    <a href="https://drive.google.com/file/d/1Ku3rjoewL-CVTr8Uc2BGzomYcgYn-Q7R/view?usp=sharing"><strong>🎬 Demo Video (Drive)</strong></a> &bull;
    <a href="https://github.com/Muqeeth47/smartcare/tree/sudophiles"><strong>📂 GitHub Repository</strong></a> &bull;
    <a href="SmartCare_Presentation_sudophiles.pdf"><strong>📄 Presentation Deck (PDF)</strong></a>
  </p>
</div>

---

## 📌 Executive Summary & Problem-Solution Fit

Public healthcare systems across India face persistent supply chain vulnerabilities. The inability to track medicines, patient footfall, and resource utilization in real time across vast networks of Primary Health Centres (PHCs) leads to stock-outs and limits the country's capacity to respond when it matters most.

**SmartCare** directly solves this challenge by deploying a closed-loop digital public health ecosystem across India's 4-tier healthcare topology:

```
[Tier 1: Citizens & Patients] (ABHA Passport, QR Triage, 108 SOS Ambulance)
             ▲
             │ Walk-in triage & e-prescriptions
             ▼
[Tier 2: Primary Health Centres] (Medicine Buffer, Bed Telemetry, Personnel Roster)
             ▲
             │ 15-Minute Telemetry Sync (Firebase Firestore)
             ▼
[Tier 3: District CMOs & Depots] (Warehouse Allocation, Logistics Manifest & OTP Delivery)
             ▲
             │ Multi-District Optimization & Outbreak Signals
             ▼
[Tier 4: State & MoHFW Command] (Vertex AI Federated Mesh & Automated Redistribution)
```

---

## 🚀 Key Solution Pillars

### 1. Real-Time Telemetry & PHC Ground Visibility
* **15-Minute Telemetry Loop**: Edge nodes at rural clinics push lightweight telemetry packets to Google Firebase Firestore every 15 minutes, ending slow weekly paper reporting.
* **Medicine Buffers**: Live tracking of 10+ essential drugs per clinic with daily burn rate calculations:
  $$\text{Days Remaining} = \left\lfloor \frac{\text{Current Stock}}{\text{Daily Consumption Rate}} \right\rfloor$$
* **Jan Aushadhi Generic Substitutions**: Direct integration with the Pradhan Mantri Bhartiya Janaushadhi Pariyojana formulary, enabling 1-click branded-to-generic swaps with 50–90% savings.
* **Bed & Personnel Telemetry**: Live occupancy counters for ICU, Oxygen-supported, and General beds, paired with daily clinical attendance tracking to prevent dangerous patient-to-doctor ratio spikes (>30:1).

### 2. AI Demand Surge Forecaster & Early Warnings
* **Epidemic Outbreak Modeling**: Simulates disease surges across 7-day, 14-day, and 30-day national projection horizons:
  * **Monsoon Dengue & Vector Surge (+75%)**: Triples demand for Paracetamol, IV normal saline, and pediatric beds.
  * **Acute Gastroenteritis (+85%)**: Accelerates ORS and Ringer Lactate depletion.
  * **Seasonal Viral Respiratory Wave (+50%)**: Pre-allocates Salbutamol inhalers and broad-spectrum antibiotics.
* **72-Hour Stock-Out Breach Flags**: Automatically alerts district commanders 48–72 hours before a facility exhausts its safety buffer.

### 3. Automated Cross-District Redistribution Engine
* **Surplus-to-Deficit Optimization**: The system matches deficit health centres with the nearest surplus central depots (e.g., *Hyderabad Central Depot* at `17.4100° N, 78.4600° E`) using Haversine distance vectors.
* **1-Click Dispatch Authorization**: Generates route-optimized logistics manifests and carrier assignments without bureaucratic phone delays.
* **6-Digit OTP Delivery Verification**: Deliveries require a two-party cryptographic OTP verification upon truck arrival at the clinic, updating inventory ledgers in real time.

### 4. Multi-State Federated AI Mesh (FedAvg)
* **Privacy by Design**: Coordinates shared predictive modeling across 5 Indian state health nodes (Telangana, Maharashtra, Kerala, Uttar Pradesh, Karnataka).
* **Federated Averaging Algorithm**: Only encrypted model gradients ($\Delta W$) are shared with the central coordinator:
  $$w_{t+1} = \sum_{k=1}^{K} \frac{n_k}{n} w_{t+1}^k$$
* **Zero Patient PII Exposure**: Absolute compliance with India's Digital Personal Data Protection (DPDP) Act 2023 and Ayushman Bharat Digital Mission (ABDM) standards—no patient health records ever leave state borders.

---

## 🛠️ Google Cloud & AI Tools Alignment

| Google Tool | Implementation & Role |
| :--- | :--- |
| **Google Firebase / Firestore** | Multi-tenant real-time database and document listeners (`studio-5671575350-61bbd`) with deployed Firestore rules. |
| **Google Cloud Vertex AI** | Architectural framework for national federated model aggregation coordinator and batch prediction pipelines. |
| **Google DeepMind Antigravity** | Agentic AI pair programming system used to architect, implement, and verify the platform. |

---

## 🔑 1-Click Interactive Demo Accounts

All portals can be accessed instantly from the single-click Quick Login grid on the [`/login`](https://smartcare-omega-two.vercel.app/login) page:

| Role | Demo Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Doctor / PHC Lead** | `hospital@smartcare.demo` | `demo1234` | Ground-level medicine stock register, ward bed allocation, clinical attendance console, and OTP inward receipt |
| **District CMO** | `cmo@district.gov.in` | `demo1234` | District shortage matrix, depot rebalance approvals, and emergency purchase order desk |
| **State Commander** | `commander@mohfw.gov.in` | `demo1234` | MoHFW State Command, 15-minute telemetry stream, AI surge forecaster, and Multi-State Federated AI |
| **Citizen & Patient** | `patient@smartcare.demo` | `demo1234` | ABHA Digital Health Passport (`91-4829-1039-4821@abdm`), live OPD queue window, and 108 Emergency Ambulance SOS |

---

## 📱 Quick Access QR Codes

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="apps/web/public/qr_live_portal.png" width="130" /><br />
        <strong>Live Prototype</strong><br />
        <a href="https://smartcare-omega-two.vercel.app/">smartcare-omega-two.vercel.app</a>
      </td>
      <td align="center">
        <img src="apps/web/public/qr_demo_video.png" width="130" /><br />
        <strong>Demo Video</strong><br />
        <a href="https://drive.google.com/file/d/1Ku3rjoewL-CVTr8Uc2BGzomYcgYn-Q7R/view?usp=sharing">Google Drive (Public View)</a>
      </td>
      <td align="center">
        <img src="apps/web/public/qr_github_repo.png" width="130" /><br />
        <strong>GitHub Repository</strong><br />
        <a href="https://github.com/Muqeeth47/smartcare/tree/sudophiles">branch: sudophiles</a>
      </td>
    </tr>
  </table>
</div>

---

## 💻 Technical Architecture & Local Setup

### Core Tech Stack
* **Framework**: Next.js 14 (App Router, Server & Client Components)
* **Language**: TypeScript 5 (Strict type safety across 33 routes)
* **Styling**: Tailwind CSS with custom glassmorphism and light/dark theme engines
* **Icons**: Lucide React (Strict Zero-Emoji policy enforced)
* **State Management**: Zustand with persistent local & Firestore synchronization
* **QR Scanner**: `jsQR` with physical device video camera access
* **Deployment**: Vercel Edge Network (`smartcare-omega-two.vercel.app`)

### Running Locally

```bash
# 1. Clone repository and switch to sudophiles branch
git clone https://github.com/Muqeeth47/smartcare.git
cd smartcare
git checkout sudophiles

# 2. Install dependencies
cd apps/web
npm install

# 3. Start local development server
npm run dev
# Open http://localhost:3000

# 4. Verify TypeScript & production build
npx tsc --noEmit
npm run build
```

---

<div align="center">
  <p><strong>Team sudophiles</strong> &bull; Google Cloud Hackathon: Build with AI: Code for Communities — Second Edition</p>
</div>
