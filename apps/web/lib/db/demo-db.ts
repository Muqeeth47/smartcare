'use client';

import type {
  QueueItem,
  PatientMedicalHistory,
  Prescription,
  DonationsData,
  HospitalDonationPost,
  PatientDonationPost,
  BloodDonationCentre,
  ProfessionalProfile,
  AppointmentBooking,
  AmbulanceBooking,
  PharmacyOrder,
  MedicineItem,
  HospitalSupplyProfile,
  ShortageReport,
  RedistributionOrder,
  DistrictSupplyAggregate,
  DistrictMedicineSummary,
  FacilityTier,
  MedicineStockStatus,
  ShortageSeverity,
} from '@smartcare/types';

// ─── Storage helpers ─────────────────────────────────────────────────────────

const readStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') as T;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// ─── Keys ────────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'smartcare.demoQueue';
const ACCOUNTS_KEY = 'smartcare.localAccounts';
const PRESCRIPTIONS_KEY = 'smartcare.prescriptions';
const DONATIONS_KEY = 'smartcare.donations';
const AMBULANCE_KEY = 'smartcare.activeAmbulance';
const AMBULANCE_HISTORY_KEY = 'smartcare.ambulanceHistory';
const PHARMACY_ORDERS_KEY = 'smartcare.pharmacyOrders';
const SUPPLY_PROFILES_KEY = 'smartcare.supplyProfiles';
const REDISTRIBUTION_ORDERS_KEY = 'smartcare.redistributionOrders';
const SHORTAGE_REPORTS_KEY = 'smartcare.shortageReports';

// ─── Module 2 Supply Default Data ──────────────────────────────────────────

const DEFAULT_SUPPLY_PROFILES: HospitalSupplyProfile[] = [
  {
    hospitalId: 'hosp-smartcare',
    hospitalName: 'SmartCare Community Hospital',
    district: 'Hyderabad',
    state: 'Telangana',
    tier: 'tertiary',
    bedsTotal: 250,
    bedsOccupied: 210,
    icuTotal: 30,
    icuOccupied: 28,
    oxygenCylindersAvailable: 75,
    oxygenCylindersTotal: 80,
    lastReportedAt: 'Today, 09:30 AM',
    coordinates: { lat: 17.385, lng: 78.4867 },
    medicines: [
      {
        id: 'med-pcm',
        name: 'Paracetamol 500mg Tablets',
        category: 'Critical Supplies',
        unit: 'Strips (10s)',
        currentStock: 1200,
        minBuffer: 500,
        dailyConsumption: 120,
        daysRemaining: 10,
        status: 'normal',
        batchNumber: 'PCM-2026-B8',
        expiryDate: '2027-11-30',
        lastUpdated: '15 mins ago',
      },
      {
        id: 'med-amox',
        name: 'Amoxicillin 250mg Capsules',
        category: 'Antibiotics',
        unit: 'Strips (10s)',
        currentStock: 800,
        minBuffer: 400,
        dailyConsumption: 90,
        daysRemaining: 9,
        status: 'normal',
        batchNumber: 'AMX-2026-C1',
        expiryDate: '2027-08-31',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-insulin',
        name: 'Insulin Glargine 100 IU/ml',
        category: 'Chronic Care',
        unit: 'Vials (10ml)',
        currentStock: 28,
        minBuffer: 100,
        dailyConsumption: 14,
        daysRemaining: 2,
        status: 'critical',
        batchNumber: 'INS-2026-K4',
        expiryDate: '2027-04-30',
        lastUpdated: 'Just now',
        activeShortage: true,
        shortageReason: 'Critical shortage: High inpatient diabetic ketoacidosis inflow and batch shipment delay.',
      },
      {
        id: 'med-ors',
        name: 'Oral Rehydration Salts (ORS)',
        category: 'Critical Supplies',
        unit: 'Sachets',
        currentStock: 1500,
        minBuffer: 600,
        dailyConsumption: 130,
        daysRemaining: 12,
        status: 'normal',
        batchNumber: 'ORS-2026-F9',
        expiryDate: '2028-01-31',
        lastUpdated: '3 hours ago',
      },
      {
        id: 'med-ns',
        name: 'IV Normal Saline 0.9% (500ml)',
        category: 'Emergency & IV',
        unit: 'Bottles',
        currentStock: 52,
        minBuffer: 200,
        dailyConsumption: 28,
        daysRemaining: 2,
        status: 'critical',
        batchNumber: 'IVS-2026-T2',
        expiryDate: '2028-06-30',
        lastUpdated: '10 mins ago',
        activeShortage: true,
        shortageReason: 'Emergency trauma admissions inflow; stock depleted past safe reserve.',
      },
      {
        id: 'med-covax',
        name: 'Covaxin Doses',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 420,
        minBuffer: 200,
        dailyConsumption: 25,
        daysRemaining: 17,
        status: 'normal',
        batchNumber: 'CVX-2026-V7',
        expiryDate: '2026-12-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-rabies',
        name: 'Anti-Rabies Vaccine (ARV)',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 55,
        minBuffer: 50,
        dailyConsumption: 7,
        daysRemaining: 8,
        status: 'normal',
        batchNumber: 'ARV-2026-R3',
        expiryDate: '2027-05-31',
        lastUpdated: '2 hours ago',
      },
      {
        id: 'med-oxy',
        name: 'Medical Oxygen Cylinders (D-Type)',
        category: 'Emergency & IV',
        unit: 'Cylinders',
        currentStock: 75,
        minBuffer: 40,
        dailyConsumption: 12,
        daysRemaining: 6,
        status: 'low',
        batchNumber: 'OXY-CYL-88',
        expiryDate: '2030-01-01',
        lastUpdated: '30 mins ago',
      },
      {
        id: 'med-asv',
        name: 'Anti-Snake Venom (ASV) Polyvalent',
        category: 'Emergency & IV',
        unit: 'Vials (10ml)',
        currentStock: 18,
        minBuffer: 20,
        dailyConsumption: 2,
        daysRemaining: 9,
        status: 'normal',
        batchNumber: 'ASV-2026-P2',
        expiryDate: '2027-09-30',
        lastUpdated: '4 hours ago',
      },
      {
        id: 'med-metform',
        name: 'Metformin 500mg Tablets',
        category: 'Chronic Care',
        unit: 'Strips (10s)',
        currentStock: 950,
        minBuffer: 500,
        dailyConsumption: 80,
        daysRemaining: 12,
        status: 'normal',
        batchNumber: 'MET-2026-M4',
        expiryDate: '2027-10-31',
        lastUpdated: 'Yesterday',
      },
    ],
  },
  {
    hospitalId: 'phc-shamshabad',
    hospitalName: 'PHC Shamshabad (Primary Health Centre)',
    district: 'Rangareddy',
    state: 'Telangana',
    tier: 'phc',
    bedsTotal: 20,
    bedsOccupied: 17,
    icuTotal: 2,
    icuOccupied: 2,
    oxygenCylindersAvailable: 3,
    oxygenCylindersTotal: 10,
    lastReportedAt: 'Today, 10:15 AM',
    coordinates: { lat: 17.2543, lng: 78.4312 },
    medicines: [
      {
        id: 'med-pcm',
        name: 'Paracetamol 500mg Tablets',
        category: 'Critical Supplies',
        unit: 'Strips (10s)',
        currentStock: 180,
        minBuffer: 300,
        dailyConsumption: 55,
        daysRemaining: 3,
        status: 'critical',
        batchNumber: 'PCM-2026-B1',
        expiryDate: '2027-09-30',
        lastUpdated: '2 hours ago',
        activeShortage: true,
        shortageReason: 'Outbreak of seasonal viral fever in local village cluster.',
      },
      {
        id: 'med-amox',
        name: 'Amoxicillin 250mg Capsules',
        category: 'Antibiotics',
        unit: 'Strips (10s)',
        currentStock: 75,
        minBuffer: 150,
        dailyConsumption: 28,
        daysRemaining: 3,
        status: 'critical',
        batchNumber: 'AMX-2026-A9',
        expiryDate: '2027-07-31',
        lastUpdated: '1 hour ago',
        activeShortage: true,
        shortageReason: 'Pediatric respiratory caseload spike.',
      },
      {
        id: 'med-insulin',
        name: 'Insulin Glargine 100 IU/ml',
        category: 'Chronic Care',
        unit: 'Vials (10ml)',
        currentStock: 4,
        minBuffer: 40,
        dailyConsumption: 4,
        daysRemaining: 1,
        status: 'critical',
        batchNumber: 'INS-2026-D3',
        expiryDate: '2027-03-31',
        lastUpdated: 'Just now',
        activeShortage: true,
        shortageReason: 'Critical stock-out: Only 24 hours of cold-chain vials left.',
      },
      {
        id: 'med-ors',
        name: 'Oral Rehydration Salts (ORS)',
        category: 'Critical Supplies',
        unit: 'Sachets',
        currentStock: 780,
        minBuffer: 300,
        dailyConsumption: 60,
        daysRemaining: 13,
        status: 'normal',
        batchNumber: 'ORS-2026-E2',
        expiryDate: '2028-02-28',
        lastUpdated: '3 hours ago',
      },
      {
        id: 'med-ns',
        name: 'IV Normal Saline 0.9% (500ml)',
        category: 'Emergency & IV',
        unit: 'Bottles',
        currentStock: 14,
        minBuffer: 80,
        dailyConsumption: 12,
        daysRemaining: 1,
        status: 'critical',
        batchNumber: 'IVS-2026-N9',
        expiryDate: '2028-05-31',
        lastUpdated: '40 mins ago',
        activeShortage: true,
        shortageReason: 'Acute gastroenteritis spike; replacement delivery delayed.',
      },
      {
        id: 'med-covax',
        name: 'Covaxin Doses',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 110,
        minBuffer: 80,
        dailyConsumption: 10,
        daysRemaining: 11,
        status: 'normal',
        batchNumber: 'CVX-2026-V1',
        expiryDate: '2026-12-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-rabies',
        name: 'Anti-Rabies Vaccine (ARV)',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 2,
        minBuffer: 20,
        dailyConsumption: 2,
        daysRemaining: 1,
        status: 'critical',
        batchNumber: 'ARV-2026-R1',
        expiryDate: '2027-04-30',
        lastUpdated: '10 mins ago',
        activeShortage: true,
        shortageReason: 'Multiple canine bite cases in panchayat; emergency buffer exhausted.',
      },
      {
        id: 'med-oxy',
        name: 'Medical Oxygen Cylinders (D-Type)',
        category: 'Emergency & IV',
        unit: 'Cylinders',
        currentStock: 3,
        minBuffer: 8,
        dailyConsumption: 2,
        daysRemaining: 1,
        status: 'critical',
        batchNumber: 'OXY-CYL-12',
        expiryDate: '2030-01-01',
        lastUpdated: '1 hour ago',
        activeShortage: true,
      },
      {
        id: 'med-asv',
        name: 'Anti-Snake Venom (ASV) Polyvalent',
        category: 'Emergency & IV',
        unit: 'Vials (10ml)',
        currentStock: 2,
        minBuffer: 10,
        dailyConsumption: 1,
        daysRemaining: 2,
        status: 'critical',
        batchNumber: 'ASV-2026-P1',
        expiryDate: '2027-06-30',
        lastUpdated: 'Yesterday',
        activeShortage: true,
      },
      {
        id: 'med-metform',
        name: 'Metformin 500mg Tablets',
        category: 'Chronic Care',
        unit: 'Strips (10s)',
        currentStock: 130,
        minBuffer: 150,
        dailyConsumption: 25,
        daysRemaining: 5,
        status: 'low',
        batchNumber: 'MET-2026-M1',
        expiryDate: '2027-09-30',
        lastUpdated: 'Yesterday',
      },
    ],
  },
  {
    hospitalId: 'phc-gachibowli',
    hospitalName: 'PHC Gachibowli (Urban Health Centre)',
    district: 'Hyderabad',
    state: 'Telangana',
    tier: 'phc',
    bedsTotal: 30,
    bedsOccupied: 21,
    icuTotal: 4,
    icuOccupied: 3,
    oxygenCylindersAvailable: 8,
    oxygenCylindersTotal: 12,
    lastReportedAt: 'Today, 08:45 AM',
    coordinates: { lat: 17.44, lng: 78.3489 },
    medicines: [
      {
        id: 'med-pcm',
        name: 'Paracetamol 500mg Tablets',
        category: 'Critical Supplies',
        unit: 'Strips (10s)',
        currentStock: 580,
        minBuffer: 300,
        dailyConsumption: 40,
        daysRemaining: 14,
        status: 'normal',
        batchNumber: 'PCM-2026-B3',
        expiryDate: '2027-10-31',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-amox',
        name: 'Amoxicillin 250mg Capsules',
        category: 'Antibiotics',
        unit: 'Strips (10s)',
        currentStock: 340,
        minBuffer: 200,
        dailyConsumption: 35,
        daysRemaining: 10,
        status: 'normal',
        batchNumber: 'AMX-2026-C4',
        expiryDate: '2027-08-31',
        lastUpdated: '2 hours ago',
      },
      {
        id: 'med-insulin',
        name: 'Insulin Glargine 100 IU/ml',
        category: 'Chronic Care',
        unit: 'Vials (10ml)',
        currentStock: 22,
        minBuffer: 30,
        dailyConsumption: 5,
        daysRemaining: 4,
        status: 'low',
        batchNumber: 'INS-2026-K1',
        expiryDate: '2027-05-31',
        lastUpdated: '3 hours ago',
      },
      {
        id: 'med-ors',
        name: 'Oral Rehydration Salts (ORS)',
        category: 'Critical Supplies',
        unit: 'Sachets',
        currentStock: 890,
        minBuffer: 400,
        dailyConsumption: 50,
        daysRemaining: 18,
        status: 'normal',
        batchNumber: 'ORS-2026-F1',
        expiryDate: '2028-03-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-ns',
        name: 'IV Normal Saline 0.9% (500ml)',
        category: 'Emergency & IV',
        unit: 'Bottles',
        currentStock: 85,
        minBuffer: 70,
        dailyConsumption: 10,
        daysRemaining: 8,
        status: 'normal',
        batchNumber: 'IVS-2026-T7',
        expiryDate: '2028-07-31',
        lastUpdated: '2 hours ago',
      },
      {
        id: 'med-covax',
        name: 'Covaxin Doses',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 240,
        minBuffer: 100,
        dailyConsumption: 15,
        daysRemaining: 16,
        status: 'normal',
        batchNumber: 'CVX-2026-V3',
        expiryDate: '2027-01-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-rabies',
        name: 'Anti-Rabies Vaccine (ARV)',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 16,
        minBuffer: 15,
        dailyConsumption: 2,
        daysRemaining: 8,
        status: 'normal',
        batchNumber: 'ARV-2026-R5',
        expiryDate: '2027-06-30',
        lastUpdated: '4 hours ago',
      },
      {
        id: 'med-oxy',
        name: 'Medical Oxygen Cylinders (D-Type)',
        category: 'Emergency & IV',
        unit: 'Cylinders',
        currentStock: 8,
        minBuffer: 6,
        dailyConsumption: 1,
        daysRemaining: 8,
        status: 'normal',
        batchNumber: 'OXY-CYL-33',
        expiryDate: '2030-01-01',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-asv',
        name: 'Anti-Snake Venom (ASV) Polyvalent',
        category: 'Emergency & IV',
        unit: 'Vials (10ml)',
        currentStock: 5,
        minBuffer: 8,
        dailyConsumption: 1,
        daysRemaining: 5,
        status: 'low',
        batchNumber: 'ASV-2026-P9',
        expiryDate: '2027-08-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-metform',
        name: 'Metformin 500mg Tablets',
        category: 'Chronic Care',
        unit: 'Strips (10s)',
        currentStock: 410,
        minBuffer: 200,
        dailyConsumption: 30,
        daysRemaining: 14,
        status: 'normal',
        batchNumber: 'MET-2026-M8',
        expiryDate: '2027-11-30',
        lastUpdated: 'Yesterday',
      },
    ],
  },
  {
    hospitalId: 'hosp-city-gen',
    hospitalName: 'City General Hospital (Charminar)',
    district: 'Hyderabad',
    state: 'Telangana',
    tier: 'district_hospital',
    bedsTotal: 400,
    bedsOccupied: 335,
    icuTotal: 50,
    icuOccupied: 41,
    oxygenCylindersAvailable: 112,
    oxygenCylindersTotal: 120,
    lastReportedAt: 'Today, 10:00 AM',
    coordinates: { lat: 17.3616, lng: 78.4747 },
    medicines: [
      {
        id: 'med-pcm',
        name: 'Paracetamol 500mg Tablets',
        category: 'Critical Supplies',
        unit: 'Strips (10s)',
        currentStock: 3500,
        minBuffer: 1000,
        dailyConsumption: 240,
        daysRemaining: 15,
        status: 'normal',
        batchNumber: 'PCM-2026-CG1',
        expiryDate: '2027-12-31',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-amox',
        name: 'Amoxicillin 250mg Capsules',
        category: 'Antibiotics',
        unit: 'Strips (10s)',
        currentStock: 2150,
        minBuffer: 800,
        dailyConsumption: 175,
        daysRemaining: 12,
        status: 'normal',
        batchNumber: 'AMX-2026-CG2',
        expiryDate: '2027-09-30',
        lastUpdated: '2 hours ago',
      },
      {
        id: 'med-insulin',
        name: 'Insulin Glargine 100 IU/ml',
        category: 'Chronic Care',
        unit: 'Vials (10ml)',
        currentStock: 280,
        minBuffer: 150,
        dailyConsumption: 24,
        daysRemaining: 12,
        status: 'normal',
        batchNumber: 'INS-2026-CG3',
        expiryDate: '2027-06-30',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-ors',
        name: 'Oral Rehydration Salts (ORS)',
        category: 'Critical Supplies',
        unit: 'Sachets',
        currentStock: 3100,
        minBuffer: 1000,
        dailyConsumption: 200,
        daysRemaining: 15,
        status: 'normal',
        batchNumber: 'ORS-2026-CG4',
        expiryDate: '2028-04-30',
        lastUpdated: '3 hours ago',
      },
      {
        id: 'med-ns',
        name: 'IV Normal Saline 0.9% (500ml)',
        category: 'Emergency & IV',
        unit: 'Bottles',
        currentStock: 820,
        minBuffer: 400,
        dailyConsumption: 60,
        daysRemaining: 14,
        status: 'normal',
        batchNumber: 'IVS-2026-CG5',
        expiryDate: '2028-08-31',
        lastUpdated: '30 mins ago',
      },
      {
        id: 'med-covax',
        name: 'Covaxin Doses',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 880,
        minBuffer: 300,
        dailyConsumption: 40,
        daysRemaining: 22,
        status: 'normal',
        batchNumber: 'CVX-2026-CG6',
        expiryDate: '2027-02-28',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-rabies',
        name: 'Anti-Rabies Vaccine (ARV)',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 135,
        minBuffer: 80,
        dailyConsumption: 10,
        daysRemaining: 13,
        status: 'normal',
        batchNumber: 'ARV-2026-CG7',
        expiryDate: '2027-07-31',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-oxy',
        name: 'Medical Oxygen Cylinders (D-Type)',
        category: 'Emergency & IV',
        unit: 'Cylinders',
        currentStock: 112,
        minBuffer: 60,
        dailyConsumption: 15,
        daysRemaining: 7,
        status: 'normal',
        batchNumber: 'OXY-CYL-CG8',
        expiryDate: '2030-01-01',
        lastUpdated: '1 hour ago',
      },
      {
        id: 'med-asv',
        name: 'Anti-Snake Venom (ASV) Polyvalent',
        category: 'Emergency & IV',
        unit: 'Vials (10ml)',
        currentStock: 34,
        minBuffer: 25,
        dailyConsumption: 3,
        daysRemaining: 11,
        status: 'normal',
        batchNumber: 'ASV-2026-CG9',
        expiryDate: '2027-10-31',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'med-metform',
        name: 'Metformin 500mg Tablets',
        category: 'Chronic Care',
        unit: 'Strips (10s)',
        currentStock: 2550,
        minBuffer: 800,
        dailyConsumption: 160,
        daysRemaining: 16,
        status: 'normal',
        batchNumber: 'MET-2026-CG10',
        expiryDate: '2027-12-31',
        lastUpdated: 'Yesterday',
      },
    ],
  },
  {
    hospitalId: 'depot-central',
    hospitalName: 'District Central Medical Warehouse (Buffer Depot)',
    district: 'Hyderabad',
    state: 'Telangana',
    tier: 'warehouse',
    bedsTotal: 0,
    bedsOccupied: 0,
    icuTotal: 0,
    icuOccupied: 0,
    oxygenCylindersAvailable: 340,
    oxygenCylindersTotal: 400,
    lastReportedAt: 'Today, 07:00 AM',
    coordinates: { lat: 17.41, lng: 78.46 },
    medicines: [
      {
        id: 'med-pcm',
        name: 'Paracetamol 500mg Tablets',
        category: 'Critical Supplies',
        unit: 'Strips (10s)',
        currentStock: 24000,
        minBuffer: 5000,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'PCM-CENTRAL-01',
        expiryDate: '2028-06-30',
        lastUpdated: 'Today',
      },
      {
        id: 'med-amox',
        name: 'Amoxicillin 250mg Capsules',
        category: 'Antibiotics',
        unit: 'Strips (10s)',
        currentStock: 17500,
        minBuffer: 4000,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'AMX-CENTRAL-02',
        expiryDate: '2028-05-31',
        lastUpdated: 'Today',
      },
      {
        id: 'med-insulin',
        name: 'Insulin Glargine 100 IU/ml',
        category: 'Chronic Care',
        unit: 'Vials (10ml)',
        currentStock: 3400,
        minBuffer: 800,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'INS-CENTRAL-03',
        expiryDate: '2027-12-31',
        lastUpdated: 'Today',
      },
      {
        id: 'med-ors',
        name: 'Oral Rehydration Salts (ORS)',
        category: 'Critical Supplies',
        unit: 'Sachets',
        currentStock: 29000,
        minBuffer: 6000,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'ORS-CENTRAL-04',
        expiryDate: '2028-12-31',
        lastUpdated: 'Today',
      },
      {
        id: 'med-ns',
        name: 'IV Normal Saline 0.9% (500ml)',
        category: 'Emergency & IV',
        unit: 'Bottles',
        currentStock: 7800,
        minBuffer: 2000,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'IVS-CENTRAL-05',
        expiryDate: '2028-11-30',
        lastUpdated: 'Today',
      },
      {
        id: 'med-covax',
        name: 'Covaxin Doses',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 11500,
        minBuffer: 2500,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'CVX-CENTRAL-06',
        expiryDate: '2027-08-31',
        lastUpdated: 'Today',
      },
      {
        id: 'med-rabies',
        name: 'Anti-Rabies Vaccine (ARV)',
        category: 'Vaccines',
        unit: 'Vials',
        currentStock: 1750,
        minBuffer: 400,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'ARV-CENTRAL-07',
        expiryDate: '2028-02-28',
        lastUpdated: 'Today',
      },
      {
        id: 'med-oxy',
        name: 'Medical Oxygen Cylinders (D-Type)',
        category: 'Emergency & IV',
        unit: 'Cylinders',
        currentStock: 340,
        minBuffer: 100,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'OXY-CENTRAL-08',
        expiryDate: '2030-01-01',
        lastUpdated: 'Today',
      },
      {
        id: 'med-asv',
        name: 'Anti-Snake Venom (ASV) Polyvalent',
        category: 'Emergency & IV',
        unit: 'Vials (10ml)',
        currentStock: 440,
        minBuffer: 100,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'ASV-CENTRAL-09',
        expiryDate: '2028-04-30',
        lastUpdated: 'Today',
      },
      {
        id: 'med-metform',
        name: 'Metformin 500mg Tablets',
        category: 'Chronic Care',
        unit: 'Strips (10s)',
        currentStock: 14500,
        minBuffer: 3000,
        dailyConsumption: 0,
        daysRemaining: 999,
        status: 'normal',
        batchNumber: 'MET-CENTRAL-10',
        expiryDate: '2028-05-31',
        lastUpdated: 'Today',
      },
    ],
  },
];

const DEFAULT_REDISTRIBUTION_ORDERS: RedistributionOrder[] = [
  {
    id: 'rebal-001',
    orderNumber: 'REBAL-2026-001',
    sourceHospitalId: 'depot-central',
    sourceHospitalName: 'District Central Medical Warehouse',
    targetHospitalId: 'phc-shamshabad',
    targetHospitalName: 'PHC Shamshabad',
    medicineId: 'med-insulin',
    medicineName: 'Insulin Glargine 100 IU/ml',
    quantity: 60,
    unit: 'Vials (10ml)',
    status: 'suggested',
    priority: 'CRITICAL',
    routeDistanceKm: 18.4,
    estimatedTransitMins: 35,
    otpCode: '582914',
    createdAt: 'Today, 10:20 AM',
  },
  {
    id: 'rebal-002',
    orderNumber: 'REBAL-2026-002',
    sourceHospitalId: 'hosp-city-gen',
    sourceHospitalName: 'City General Hospital (Charminar)',
    targetHospitalId: 'hosp-smartcare',
    targetHospitalName: 'SmartCare Community Hospital',
    medicineId: 'med-ns',
    medicineName: 'IV Normal Saline 0.9% (500ml)',
    quantity: 120,
    unit: 'Bottles',
    status: 'in_transit',
    priority: 'CRITICAL',
    routeDistanceKm: 12.1,
    estimatedTransitMins: 25,
    otpCode: '941073',
    createdAt: 'Today, 09:45 AM',
  },
  {
    id: 'rebal-003',
    orderNumber: 'REBAL-2026-003',
    sourceHospitalId: 'depot-central',
    sourceHospitalName: 'District Central Medical Warehouse',
    targetHospitalId: 'phc-shamshabad',
    targetHospitalName: 'PHC Shamshabad',
    medicineId: 'med-rabies',
    medicineName: 'Anti-Rabies Vaccine (ARV)',
    quantity: 25,
    unit: 'Vials',
    status: 'approved',
    priority: 'HIGH',
    routeDistanceKm: 18.4,
    estimatedTransitMins: 35,
    otpCode: '318764',
    createdAt: 'Today, 10:25 AM',
  },
];

const DEFAULT_SHORTAGE_REPORTS: ShortageReport[] = [
  {
    id: 'short-001',
    hospitalId: 'phc-shamshabad',
    hospitalName: 'PHC Shamshabad',
    district: 'Rangareddy',
    medicineId: 'med-insulin',
    medicineName: 'Insulin Glargine 100 IU/ml',
    severity: 'critical',
    currentStock: 4,
    minBuffer: 40,
    daysRemaining: 1,
    reason: 'Critical stock-out: Only 24 hours of cold-chain vials left.',
    reportedAt: 'Today, 10:15 AM',
    reportedBy: 'Dr Ramesh Kumar (MO)',
    resolved: false,
  },
  {
    id: 'short-002',
    hospitalId: 'hosp-smartcare',
    hospitalName: 'SmartCare Community Hospital',
    district: 'Hyderabad',
    medicineId: 'med-insulin',
    medicineName: 'Insulin Glargine 100 IU/ml',
    severity: 'critical',
    currentStock: 28,
    minBuffer: 100,
    daysRemaining: 2,
    reason: 'Critical shortage: High inpatient diabetic ketoacidosis inflow and batch shipment delay.',
    reportedAt: 'Today, 09:30 AM',
    reportedBy: 'Dr Meera Shah',
    resolved: false,
  },
  {
    id: 'short-003',
    hospitalId: 'hosp-smartcare',
    hospitalName: 'SmartCare Community Hospital',
    district: 'Hyderabad',
    medicineId: 'med-ns',
    medicineName: 'IV Normal Saline 0.9% (500ml)',
    severity: 'critical',
    currentStock: 52,
    minBuffer: 200,
    daysRemaining: 2,
    reason: 'Emergency trauma admissions inflow; stock depleted past safe reserve.',
    reportedAt: 'Today, 09:32 AM',
    reportedBy: 'Dr Meera Shah',
    resolved: false,
  },
  {
    id: 'short-004',
    hospitalId: 'phc-shamshabad',
    hospitalName: 'PHC Shamshabad',
    district: 'Rangareddy',
    medicineId: 'med-rabies',
    medicineName: 'Anti-Rabies Vaccine (ARV)',
    severity: 'critical',
    currentStock: 2,
    minBuffer: 20,
    daysRemaining: 1,
    reason: 'Multiple canine bite cases in panchayat; emergency buffer exhausted.',
    reportedAt: 'Today, 10:18 AM',
    reportedBy: 'Dr Ramesh Kumar (MO)',
    resolved: false,
  },
];


// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_QUEUE: QueueItem[] = [
  {
    id: 'SC-DEMO001',
    name: 'Maya Singh',
    age: 29,
    gender: 'Female',
    doctorPref: 'General consultation',
    area: 'Hyderabad',
    symptoms: 'Follow-up consultation',
    problem: 'Follow-up consultation',
    hospital: 'SmartCare Community Hospital',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    triage: 'Green',
    fee: 125,
    status: 'waiting',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
  },
];

const DEMO_USERS: Record<string, ProfessionalProfile & { password: string; name?: string }> = {
  'patient@smartcare.demo': {
    email: 'patient@smartcare.demo',
    password: 'demo1234',
    role: 'patient',
    name: 'Asha Rao',
    hospital: 'SmartCare Community Hospital',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
  },
  'hospital@smartcare.demo': {
    email: 'hospital@smartcare.demo',
    password: 'demo1234',
    role: 'doctor',
    hospital: 'SmartCare Community Hospital',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
  },
  'admin@smartcare.demo': {
    email: 'admin@smartcare.demo',
    password: 'demo1234',
    role: 'staff',
    hospital: 'SmartCare Community Hospital',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
  },
};

const DEMO_BLOOD_CENTRES: BloodDonationCentre[] = [
  {
    id: 'blood-demo-1',
    name: 'SmartCare Community Hospital Blood Bank',
    area: 'Banjara Hills, Hyderabad',
    city: 'hyderabad',
    supported_groups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    hours: 'Open today · 09:00–17:00',
    note: 'Supports all common blood groups.',
  },
  {
    id: 'blood-demo-2',
    name: 'Red Cross Donation Centre',
    area: 'Secunderabad, Hyderabad',
    city: 'hyderabad',
    supported_groups: ['A+', 'B+', 'AB+', 'O+'],
    hours: 'Open today · 10:00–18:00',
    note: 'Call ahead for group-specific availability.',
  },
  {
    id: 'blood-demo-3',
    name: 'CityCare Blood Services',
    area: 'Kukatpally, Hyderabad',
    city: 'hyderabad',
    supported_groups: ['A-', 'B-', 'AB-', 'O-'],
    hours: 'Open today · 08:00–16:00',
    note: 'Bring a valid photo ID for screening.',
  },
];

const DEFAULT_DONATIONS: DonationsData = {
  hospitalPosts: [
    { id: 'h-don-1', type: 'blood', mode: 'offer', group: 'O+', units: 4, hospital: 'SmartCare Community Hospital', city: 'Hyderabad', urgency: 'Routine', notes: 'Blood Bank Lab 01', date: 'Today' },
    { id: 'h-don-2', type: 'blood', mode: 'request', group: 'AB−', units: 2, hospital: 'City General Clinic', city: 'Secunderabad', urgency: 'Urgent', notes: 'Emergency ward requirement', date: 'Today' },
    { id: 'h-don-3', type: 'organ', mode: 'request', group: 'Kidney', units: 1, hospital: 'SmartCare Community Hospital', city: 'Hyderabad', urgency: 'Urgent', notes: 'Matching O+ / A+ donor', date: 'Yesterday' },
    { id: 'h-don-4', type: 'organ', mode: 'offer', group: 'Cornea', units: 2, hospital: 'Apollo Care Centre', city: 'Hyderabad', urgency: 'Planned', notes: 'Preserved in Eye Bank', date: '2 days ago' },
  ],
  patientPosts: [
    { id: 'p-don-1', type: 'blood', mode: 'give', name: 'Ravi Kumar', group: 'O+', city: 'Hyderabad', phone: '+91 98490 12345', email: 'ravi.kumar@example.com', notes: 'Available on weekends, Banjara Hills', status: 'Available', date: 'Today' },
    { id: 'p-don-2', type: 'blood', mode: 'give', name: 'Priya Mukherjee', group: 'AB−', city: 'Secunderabad', phone: '+91 94401 98765', email: 'priya.m@example.com', notes: 'Regular donor, voluntary', status: 'Available', date: 'Yesterday' },
    { id: 'p-don-3', type: 'blood', mode: 'receive', name: 'Arun Varma', group: 'B+', city: 'Hyderabad', phone: '+91 80081 23456', email: 'arun.v@example.com', urgency: 'Urgent', status: 'Pending', date: 'Today' },
    { id: 'p-don-4', type: 'organ', mode: 'give', name: 'K. Sharma (Pledged)', group: 'Kidney', city: 'Hyderabad', phone: '+91 97000 11223', email: 'k.sharma@example.com', status: 'Registered', date: '3 days ago' },
    { id: 'p-don-5', type: 'organ', mode: 'give', name: 'Anita Desai (Pledged)', group: 'Cornea', city: 'Hyderabad', phone: '+91 91234 56789', email: 'anita.d@example.com', status: 'Registered', date: '1 week ago' },
    { id: 'p-don-6', type: 'organ', mode: 'receive', name: 'Mohan Reddy', group: 'Liver', city: 'Secunderabad', phone: '+91 99887 66554', email: 'mohan.r@example.com', urgency: 'Urgent', status: 'Pending', date: 'Yesterday' },
  ],
};

const DEFAULT_PRESCRIPTIONS: Record<string, Prescription> = {
  'visit-demo-001': {
    rxId: 'RX-2026-DEMO01',
    visitId: 'visit-demo-001',
    patientName: 'Asha Rao',
    patientAge: 29,
    patientGender: 'Female',
    vitals: { bp: '120/80 mmHg', pulse: '72 bpm', temp: '98.6°F', weight: '58 kg' },
    assessment: 'Seasonal upper respiratory symptoms; acute pharyngitis and mild fever.',
    medicines: [
      { name: 'Paracetamol', strength: '500 mg', dosage: '1-0-1', duration: '3 days', instructions: 'Take after food for fever control' },
      { name: 'Amoxyclav', strength: '625 mg', dosage: '1-0-1', duration: '5 days', instructions: 'Complete full antibacterial course' },
      { name: 'Cetirizine', strength: '10 mg', dosage: '0-0-1', duration: '5 days', instructions: 'Take at bedtime for allergic congestion' },
    ],
    labSummary: 'Demo CBC summary: parameters within normal reference range.',
    providerName: 'Dr Meera Shah',
    doctorNmc: 'NMC-2018-94821',
    hospital: 'SmartCare Community Hospital',
    issuedAt: '18 Jul 2026',
    status: 'active',
    tamperHash: 'SEC-99A82B-VERIFIED',
    demo: true,
  },
};

const DEFAULT_PHARMACY_ORDERS: PharmacyOrder[] = [
  {
    id: 'PHARM-DEMO1',
    rxId: 'RX-2026-DEMO01',
    patientName: 'Asha Rao',
    counterNo: 'Counter #02',
    items: [
      { name: 'Paracetamol 500mg', isGeneric: true, price: 15, quantity: 1 },
      { name: 'Amoxyclav 625mg', isGeneric: false, price: 120, quantity: 1 },
    ],
    total: 135,
    fulfillmentType: 'counter',
    status: 'ready',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

const DEFAULT_MEDICAL_HISTORY: PatientMedicalHistory = {
  lastUpdated: '',
  previousProvider: { doctorName: '', hospitalName: '', city: '', contactPhone: '' },
  diseases: [],
  personalPreferences: [],
  effectiveMedications: [],
  allergiesAndAvoid: [],
  careConditions: [],
  emergencyProtocols: [],
};

const DEMO_MEDICAL_HISTORY: PatientMedicalHistory = {
  lastUpdated: '18 Jul 2026, 10:30 am',
  previousProvider: { doctorName: 'Dr Meera Shah', hospitalName: 'SmartCare Community Hospital', city: 'Hyderabad', contactPhone: '+91 40 4000 1200' },
  diseases: [{ id: 'demo-condition-1', diseaseName: 'Mild asthma', diagnosedSince: '2019', status: 'Managed' }],
  personalPreferences: [{ id: 'demo-preference-1', category: 'Communication', preference: 'Explain medication changes before prescribing' }],
  effectiveMedications: [{ id: 'demo-medication-1', medicineName: 'Salbutamol inhaler', dosage: '100 mcg as needed', conditionTreated: 'Asthma symptoms', notes: 'Use with spacer as previously advised' }],
  allergiesAndAvoid: [{ id: 'demo-allergy-1', substance: 'Penicillin', severity: 'Moderate', reactionDescription: 'Reported skin rash; clinician verification required' }],
  careConditions: [{ id: 'demo-care-1', category: 'Respiratory care', instruction: 'Check inhaler use and oxygen saturation during respiratory visits' }],
  emergencyProtocols: [{ id: 'demo-protocol-1', triggerCondition: 'Severe breathing difficulty', actionSteps: "Seek emergency assessment immediately and follow the treating clinician's acute asthma protocol" }],
};

// ─── Queue helpers ────────────────────────────────────────────────────────────

function getQueue(): QueueItem[] {
  const stored = readStorage<QueueItem[]>(QUEUE_KEY);
  if (Array.isArray(stored) && stored.length) {
    // Refresh seed patient timestamp if stale
    const seed = stored.find((item) => item.id === 'SC-DEMO001' && item.status === 'waiting');
    if (seed && Date.now() - new Date(seed.created_at).getTime() > 2 * 60 * 60 * 1000) {
      seed.created_at = new Date(Date.now() - 18 * 60000).toISOString();
      writeStorage(QUEUE_KEY, stored);
    }
    return stored;
  }
  writeStorage(QUEUE_KEY, DEFAULT_QUEUE);
  return [...DEFAULT_QUEUE];
}

function saveQueue(queue: QueueItem[]): void {
  writeStorage(QUEUE_KEY, queue);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartcare:queue-updated', { detail: [...queue] }));
  }
}

// ─── Accounts helpers ────────────────────────────────────────────────────────

function getAllUsers(): Record<string, typeof DEMO_USERS[string]> {
  const saved = readStorage<Record<string, typeof DEMO_USERS[string]>>(ACCOUNTS_KEY);
  return { ...DEMO_USERS, ...(saved && typeof saved === 'object' ? saved : {}) };
}

function saveRegisteredUsers(users: Record<string, typeof DEMO_USERS[string]>): void {
  const registered = Object.fromEntries(Object.entries(users).filter(([email]) => !DEMO_USERS[email]));
  writeStorage(ACCOUNTS_KEY, registered);
}

// ─── Public DB API ───────────────────────────────────────────────────────────

export const DemoDB = {
  // Auth
  checkCredentials: async (hospital: string, email: string, password: string, role: string) => {
    // Extensible API Hook: If external API endpoint is configured, query remote service first
    const apiEndpoint = process.env.NEXT_PUBLIC_AUTH_API_URL || (typeof window !== 'undefined' ? (window as any).__SMARTCARE_AUTH_API__ : null);
    if (apiEndpoint) {
      try {
        const res = await fetch(`${apiEndpoint}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hospital, email, password, role }),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, user: data.user };
        }
      } catch (err) {
        console.warn('External Auth API unreachable, checking local demo database.', err);
      }
    }

    const users = getAllUsers();
    const user = users[email.toLowerCase()];
    const hospitalMatches = role === 'patient' || !hospital || String(user?.hospital || '').toLowerCase() === String(hospital).toLowerCase();
    if (user && user.password === password && user.role === role && hospitalMatches) {
      return { success: true, user: { email: user.email, role: user.role, hospital: user.hospital || '', country: user.country, state: user.state || '', city: user.city || '', name: user.name } };
    }
    return { success: false, error: 'The email, password, portal, or care centre does not match this account.' };
  },

  checkEmailExists: async (email: string) => {
    const users = getAllUsers();
    return { success: !!users[email.toLowerCase()] };
  },

  registerProfessional: async (data: { email: string; password: string; role: string; hospital: string }) => {
    const users = getAllUsers();
    const email = data.email.toLowerCase();
    if (users[email]) return { success: false, error: 'An account with this email already exists.' };
    const newUser = { email, password: data.password, role: data.role as 'doctor' | 'staff', hospital: data.hospital, country: 'India', state: 'Telangana', city: 'Hyderabad' };
    users[email] = newUser;
    saveRegisteredUsers(users);
    return { success: true, user: { email, role: newUser.role, hospital: newUser.hospital, country: newUser.country, state: newUser.state, city: newUser.city } };
  },

  registerPatient: async (data: { email: string; password: string; name: string; city?: string }) => {
    // Extensible API Hook: If external API endpoint is configured, query remote service first
    const apiEndpoint = process.env.NEXT_PUBLIC_AUTH_API_URL || (typeof window !== 'undefined' ? (window as any).__SMARTCARE_AUTH_API__ : null);
    if (apiEndpoint) {
      try {
        const res = await fetch(`${apiEndpoint}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, role: 'patient' }),
        });
        if (res.ok) {
          const resData = await res.json();
          return { success: true, user: resData.user };
        }
      } catch (err) {
        console.warn('External Auth API unreachable, saving into local demo database.', err);
      }
    }

    const users = getAllUsers();
    const email = data.email.toLowerCase();
    if (users[email]) return { success: false, error: 'An account with this email already exists.' };
    const newUser = {
      email,
      password: data.password,
      role: 'patient' as const,
      name: data.name,
      hospital: 'SmartCare Community Hospital',
      country: 'India',
      state: 'Telangana',
      city: data.city || 'Hyderabad',
    };
    users[email] = newUser;
    saveRegisteredUsers(users);
    return {
      success: true,
      user: {
        email,
        role: 'patient' as const,
        name: data.name,
        hospital: newUser.hospital,
        country: newUser.country,
        state: newUser.state,
        city: newUser.city,
      },
    };
  },

  verifyPasswordHint: async () => ({ success: false, error: 'Password recovery is unavailable in local demo mode.' }),
  resetPassword: async () => ({ success: false, error: 'Password recovery is unavailable in local demo mode.' }),

  // Queue
  fetchQueue: async (): Promise<QueueItem[]> => getQueue(),

  listenToQueue: (onUpdate: (q: QueueItem[]) => void): (() => void) => {
    const localHandler = (e: Event) => onUpdate((e as CustomEvent).detail || []);
    const storageHandler = (e: StorageEvent) => {
      if (e.key !== QUEUE_KEY) return;
      const next = readStorage<QueueItem[]>(QUEUE_KEY);
      onUpdate(Array.isArray(next) ? next : []);
    };
    window.addEventListener('smartcare:queue-updated', localHandler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('smartcare:queue-updated', localHandler);
      window.removeEventListener('storage', storageHandler);
    };
  },

  addPatient: async (data: Partial<AppointmentBooking> & { patientEmail?: string; demoMirrored?: boolean; queueHospital?: string; requestedHospital?: string; triage?: string; fee?: number }): Promise<string> => {
    const queue = getQueue();
    const id = `SC-${Date.now().toString(36).toUpperCase()}`;
    const record: QueueItem = {
      id,
      name: data.name || 'Patient',
      age: parseInt(String(data.age)) || 30,
      gender: data.gender || 'Not specified',
      doctorPref: data.doctorPref || 'General consultation',
      department: data.department || 'General medicine',
      doctorId: data.doctorId || '',
      doctorName: data.doctorName || data.doctorPref || 'Next available clinician',
      consultationType: data.consultationType || 'In-person consultation',
      appointmentDate: data.appointmentDate || new Date().toISOString().slice(0, 10),
      appointmentSlot: data.appointmentSlot || 'Next available',
      patientEmail: data.patientEmail || '',
      queueHospital: data.queueHospital || data.hospital || 'SmartCare Community Hospital',
      requestedHospital: data.requestedHospital || data.hospital || 'SmartCare Community Hospital',
      demoMirrored: data.demoMirrored === true,
      area: data.area || 'Hyderabad',
      symptoms: data.symptoms || 'General consultation',
      problem: data.symptoms || 'General consultation',
      hospital: data.hospital || 'SmartCare Community Hospital',
      country: data.country || 'India',
      state: data.state || 'Telangana',
      city: data.city || 'Hyderabad',
      triage: (data.triage || 'Unassessed') as QueueItem['triage'],
      fee: data.fee || 125,
      created_at: new Date().toISOString(),
      status: 'waiting',
    };
    queue.push(record);
    saveQueue(queue);
    return id;
  },

  updatePatient: async (id: string, updates: Partial<QueueItem>): Promise<void> => {
    const queue = getQueue();
    const record = queue.find((item) => item.id === id);
    if (record) {
      Object.assign(record, updates);
      saveQueue(queue);
    }
  },

  removePatient: async (id: string): Promise<void> => {
    const queue = getQueue().filter((item) => item.id !== id);
    saveQueue(queue);
  },

  // Blood / Organ
  findBloodCentres: async ({ group, city }: { group?: string; city?: string }): Promise<BloodDonationCentre[]> => {
    return DEMO_BLOOD_CENTRES.filter(
      (c) =>
        (!group || c.supported_groups.includes(group)) &&
        (!city || c.city.includes(city.toLowerCase()) || c.area.toLowerCase().includes(city.toLowerCase()))
    );
  },

  submitDonationInterest: async (payload: Record<string, unknown>) => ({ success: true, id: `donation-demo-${Date.now()}`, payload }),

  // Appointments Cancellation & Refunds
  cancelAppointment: async (
    id: string,
    cancelledBy: 'patient' | 'doctor' = 'patient',
    reason = 'Schedule conflict'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updates: Partial<QueueItem> = {
        status: 'cancelled',
        cancelledBy,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        refundStatus: cancelledBy === 'doctor' ? 'eligible' : 'none',
      };
      await DemoDB.updatePatient(id, updates);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('smartcare:appointment-cancelled', {
            detail: { id, cancelledBy, reason, cancelledAt: updates.cancelledAt },
          })
        );
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to cancel appointment.' };
    }
  },

  claimRefund: async (id: string): Promise<{ success: boolean; ref?: string; error?: string }> => {
    try {
      const ref = 'REF-' + Date.now().toString(36).toUpperCase();
      const updates: Partial<QueueItem> = {
        refundStatus: 'claimed',
        refundRef: ref,
        refundClaimedAt: new Date().toISOString(),
      };
      await DemoDB.updatePatient(id, updates);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartcare:refund-claimed', { detail: { id, ref, now: updates.refundClaimedAt } }));
      }
      return { success: true, ref };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to claim refund' };
    }
  },

  getCancelledAppointments: (): QueueItem[] => {
    const queue = getQueue();
    return queue.filter((item) => item.status === 'cancelled');
  },

  // Prescriptions & Anti-Abuse
  getPrescription: (visitId: string): Prescription | null => {
    const stored = readStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    return stored[visitId] || DEFAULT_PRESCRIPTIONS[visitId] || null;
  },

  getPrescriptionByRxId: (rxId: string): Prescription | null => {
    const clean = String(rxId || '').trim();
    if (!clean) return null;
    const stored = readStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    for (const key of Object.keys(stored)) {
      if (stored[key].rxId === clean || key === clean) {
        return stored[key];
      }
    }
    // Check default prescriptions
    for (const key of Object.keys(DEFAULT_PRESCRIPTIONS)) {
      if (DEFAULT_PRESCRIPTIONS[key].rxId === clean || key === clean) {
        return DEFAULT_PRESCRIPTIONS[key];
      }
    }
    if (clean === 'RX-2026-DEMO01' || clean === 'visit-demo-001' || clean === 'SC-DEMO001' || clean === 'RX-2026-8821') {
      return DEFAULT_PRESCRIPTIONS['visit-demo-001'];
    }
    return null;
  },

  savePrescription: (visitId: string, prescription: Prescription): Prescription => {
    const id = String(visitId || '');
    if (!id) throw new Error('A visit reference is required.');
    const stored = readStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    const rxId = prescription.rxId || `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const saved: Prescription = {
      ...prescription,
      rxId,
      visitId: id,
      doctorNmc: prescription.doctorNmc || 'NMC-2018-94821',
      hospital: prescription.hospital || 'SmartCare Community Hospital',
      status: prescription.status || 'active',
      tamperHash: prescription.tamperHash || `SEC-${Math.random().toString(36).slice(2, 8).toUpperCase()}-VERIFIED`,
      demo: true,
    };
    stored[id] = saved;
    writeStorage(PRESCRIPTIONS_KEY, stored);
    return saved;
  },

  dispensePrescription: (
    rxId: string,
    pharmacistInfo: { pharmacistName?: string; pharmacyName?: string; licenseNo?: string } = {}
  ): { success: boolean; prescription?: Prescription; alreadyDispensed?: boolean; error?: string } => {
    const clean = String(rxId || '').trim();
    const stored = readStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    let foundKey: string | null = null;
    for (const key of Object.keys(stored)) {
      if (stored[key].rxId === clean || key === clean) {
        foundKey = key;
        break;
      }
    }
    if (!foundKey && (clean === 'RX-2026-DEMO01' || clean === 'visit-demo-001' || clean === 'SC-DEMO001' || clean === 'RX-2026-8821')) {
      foundKey = 'visit-demo-001';
      stored[foundKey] = { ...DEFAULT_PRESCRIPTIONS['visit-demo-001'] };
    }
    if (!foundKey || !stored[foundKey]) {
      return { success: false, error: 'Prescription record not found in registered hospital database.' };
    }
    if (stored[foundKey].status === 'dispensed') {
      return {
        success: false,
        alreadyDispensed: true,
        error: `This prescription was already dispensed at ${stored[foundKey].dispensedBy || 'SmartCare Pharmacy'} on ${stored[foundKey].dispensedAt || 'an earlier date'}. Duplicate dispensing is strictly prohibited.`,
      };
    }
    stored[foundKey].status = 'dispensed';
    stored[foundKey].dispensedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    stored[foundKey].dispensedBy = pharmacistInfo.pharmacyName || 'SmartCare Hospital In-House Dispensary';
    stored[foundKey].dispensedPharmacist = pharmacistInfo.pharmacistName || 'Registered Pharmacist';
    stored[foundKey].pharmacistLicense = pharmacistInfo.licenseNo || 'TS-PH-8821';
    writeStorage(PRESCRIPTIONS_KEY, stored);
    return { success: true, prescription: stored[foundKey] };
  },

  // Ambulance Fleet Management
  getActiveAmbulance: (): AmbulanceBooking | null => {
    return readStorage<AmbulanceBooking>(AMBULANCE_KEY) || null;
  },

  bookAmbulance: (request: Partial<AmbulanceBooking>): AmbulanceBooking => {
    const id = 'AMB-' + Date.now().toString(36).toUpperCase();
    const booking: AmbulanceBooking = {
      id,
      type: request.type || 'ALS',
      typeLabel:
        request.type === 'BLS'
          ? 'Basic Life Support (BLS)'
          : request.type === 'PatientTransport'
          ? 'Patient Transport Vehicle'
          : 'Advanced Life Support / ICU (ALS)',
      status: 'dispatched',
      patientName: request.patientName || 'Emergency Patient',
      patientPhone: request.patientPhone || '+91 98490 12345',
      pickupAddress: request.pickupAddress || 'Current GPS Emergency Location',
      coords: request.coords || { lat: 17.4126, lng: 78.4482 },
      hospital: request.hospital || 'SmartCare Trauma Centre (Banjara Hills)',
      cost: request.type === 'BLS' ? 750 : request.type === 'PatientTransport' ? 500 : 1800,
      driver: {
        name: 'Ram Singh (Senior EMT)',
        phone: '+91 98490 11234',
        vehicleNo: 'TS-09-EM-4412',
        vehicleModel: 'Force Traveller Advanced ICU',
      },
      etaMinutes: request.type === 'ALS' ? 7 : request.type === 'BLS' ? 10 : 18,
      dispatchedAt: new Date().toISOString(),
    };
    writeStorage(AMBULANCE_KEY, booking);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:ambulance-dispatched', { detail: booking }));
    }
    return booking;
  },

  cancelAmbulance: (id: string, reason = 'Emergency situation managed'): { success: boolean; error?: string } => {
    const current = DemoDB.getActiveAmbulance();
    if (current && current.id === id) {
      current.status = 'cancelled';
      current.cancelReason = reason;
      current.cancelledAt = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AMBULANCE_KEY);
        const history = readStorage<AmbulanceBooking[]>(AMBULANCE_HISTORY_KEY) || [];
        history.unshift(current);
        writeStorage(AMBULANCE_HISTORY_KEY, history.slice(0, 10));
        window.dispatchEvent(new CustomEvent('smartcare:ambulance-cancelled', { detail: current }));
      }
      return { success: true };
    }
    return { success: false, error: 'No active ambulance dispatch found.' };
  },

  // In-House Pharmacy Orders
  getPharmacyOrders: (): PharmacyOrder[] => {
    const stored = readStorage<PharmacyOrder[]>(PHARMACY_ORDERS_KEY);
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_PHARMACY_ORDERS;
  },

  createPharmacyOrder: (order: Partial<PharmacyOrder>): PharmacyOrder => {
    const orders = DemoDB.getPharmacyOrders();
    const id = 'PHARM-' + Date.now().toString(36).toUpperCase();
    const newOrder: PharmacyOrder = {
      id,
      rxId: order.rxId || 'RX-DIRECT',
      patientName: order.patientName || 'Patient',
      counterNo: order.fulfillmentType === 'counter' ? 'Counter #02' : 'Home Delivery Dispatch',
      items: order.items || [],
      total: order.total || 0,
      fulfillmentType: order.fulfillmentType || 'counter',
      deliveryAddress: order.deliveryAddress,
      status: 'placed',
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    writeStorage(PHARMACY_ORDERS_KEY, orders.slice(0, 30));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:pharmacy-order-created', { detail: newOrder }));
    }
    return newOrder;
  },

  updatePharmacyOrderStatus: (
    id: string,
    nextStatus: PharmacyOrder['status']
  ): { success: boolean; error?: string } => {
    const orders = DemoDB.getPharmacyOrders();
    const found = orders.find((o) => o.id === id);
    if (found) {
      found.status = nextStatus;
      found.updatedAt = new Date().toISOString();
      writeStorage(PHARMACY_ORDERS_KEY, orders);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartcare:pharmacy-order-updated', { detail: found }));
      }
      return { success: true };
    }
    return { success: false, error: 'Order not found' };
  },

  // Donations
  getDonationsData: (): DonationsData => {
    const stored = readStorage<DonationsData>(DONATIONS_KEY);
    if (stored && Array.isArray(stored.hospitalPosts) && Array.isArray(stored.patientPosts)) return stored;
    writeStorage(DONATIONS_KEY, DEFAULT_DONATIONS);
    return { ...DEFAULT_DONATIONS };
  },

  saveDonationsData: (data: DonationsData): void => writeStorage(DONATIONS_KEY, data),

  addHospitalDonation: (item: Omit<HospitalDonationPost, 'id' | 'date'>): HospitalDonationPost => {
    const data = DemoDB.getDonationsData();
    const newItem: HospitalDonationPost = { id: `h-don-${Date.now()}`, date: 'Just now', ...item };
    data.hospitalPosts.unshift(newItem);
    DemoDB.saveDonationsData(data);
    return newItem;
  },

  addPatientDonation: (item: Omit<PatientDonationPost, 'id' | 'date' | 'status'>): PatientDonationPost => {
    const data = DemoDB.getDonationsData();
    const newItem: PatientDonationPost = { id: `p-don-${Date.now()}`, date: 'Just now', status: item.mode === 'give' ? 'Available' : 'Pending', ...item };
    data.patientPosts.unshift(newItem);
    DemoDB.saveDonationsData(data);
    return newItem;
  },

  addPatientPost: (item: Omit<PatientDonationPost, 'id' | 'date' | 'status'>): PatientDonationPost => {
    return DemoDB.addPatientDonation(item);
  },

  deletePatientPost: (postId: string): boolean => {
    const data = DemoDB.getDonationsData();
    const initialLen = data.patientPosts.length;
    data.patientPosts = data.patientPosts.filter((p) => p.id !== postId);
    if (data.patientPosts.length !== initialLen) {
      DemoDB.saveDonationsData(data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartcare:donation-post-deleted', { detail: { id: postId } }));
      }
      return true;
    }
    return false;
  },

  // Medical History
  getMedicalHistory: (ownerEmail: string): PatientMedicalHistory => {
    const normalized = ownerEmail.trim().toLowerCase();
    const key = `smartcare.medicalHistory:${normalized}`;
    const stored = readStorage<PatientMedicalHistory>(key);
    if (stored && Array.isArray(stored.effectiveMedications)) return stored;
    const initial = normalized === 'patient@smartcare.demo' ? { ...DEMO_MEDICAL_HISTORY } : { ...DEFAULT_MEDICAL_HISTORY };
    writeStorage(key, initial);
    return initial;
  },

  saveMedicalHistory: (ownerEmail: string, history: PatientMedicalHistory): void => {
    const key = `smartcare.medicalHistory:${ownerEmail.trim().toLowerCase()}`;
    writeStorage(key, history);
  },

  // Passport
  registerMedicalPassport: (passportId: string, ownerEmail: string): void => {
    const cleanId = passportId.trim();
    if (!cleanId || !ownerEmail) return;
    writeStorage(`smartcare.passportOwner:${cleanId}`, ownerEmail.toLowerCase());
  },

  getMedicalPassport: (scannedValue: string, viewerRole: string): { passportId: string; profile: Record<string, string>; history: PatientMedicalHistory } | null => {
    if (!['doctor', 'staff'].includes(viewerRole)) return null;
    const raw = scannedValue.trim();
    let passportId = raw;
    try {
      const url = new URL(raw, 'https://example.com');
      passportId = url.searchParams.get('passportId') || url.searchParams.get('pin') || raw;
    } catch {}
    if (!passportId.startsWith('SC-PASSPORT-')) return null;
    let owner = readStorage<string>(`smartcare.passportOwner:${passportId}`) || '';
    if (!owner && passportId === 'SC-PASSPORT-8924') owner = 'patient@smartcare.demo';
    if (!owner) return null;
    const savedProfile = readStorage<Record<string, string>>(`smartcare.patientProfile_${owner}`) || {};
    const profile = owner === 'patient@smartcare.demo'
      ? { name: 'Asha Rao', age: '32', gender: 'Female', city: 'Hyderabad', ...savedProfile }
      : { name: owner.split('@')[0].replace(/[._-]/g, ' '), age: 'Not provided', gender: 'Not specified', city: 'Not provided', ...savedProfile };
    return { passportId, profile, history: DemoDB.getMedicalHistory(owner) };
  },

  // ─── Module 2: AushadhiNet & Supply Chain Database ─────────────────────────

  getAllSupplyProfiles: (): HospitalSupplyProfile[] => {
    const stored = readStorage<HospitalSupplyProfile[]>(SUPPLY_PROFILES_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    writeStorage(SUPPLY_PROFILES_KEY, DEFAULT_SUPPLY_PROFILES);
    return DEFAULT_SUPPLY_PROFILES;
  },

  getHospitalSupplyProfile: (hospitalIdentifier?: string): HospitalSupplyProfile => {
    const profiles = DemoDB.getAllSupplyProfiles();
    if (!hospitalIdentifier) return profiles[0] || DEFAULT_SUPPLY_PROFILES[0];
    const clean = hospitalIdentifier.trim().toLowerCase();
    const match =
      profiles.find(
        (p) =>
          p.hospitalId.toLowerCase() === clean ||
          p.hospitalName.toLowerCase().includes(clean) ||
          clean.includes(p.hospitalName.toLowerCase()) ||
          clean.includes(p.hospitalId.toLowerCase())
      ) ||
      profiles.find((p) => p.tier === 'tertiary') ||
      profiles[0];
    return match || DEFAULT_SUPPLY_PROFILES[0];
  },

  updateMedicineStock: (
    hospitalId: string,
    medicineId: string,
    currentStock: number,
    dailyConsumption?: number,
    shortageReason?: string,
    isShortageAlert?: boolean
  ): HospitalSupplyProfile => {
    const profiles = DemoDB.getAllSupplyProfiles();
    let updatedProfile: HospitalSupplyProfile | null = null;

    const newProfiles = profiles.map((facility) => {
      const match =
        facility.hospitalId.toLowerCase() === hospitalId.toLowerCase() ||
        facility.hospitalName.toLowerCase().includes(hospitalId.toLowerCase());

      if (!match) return facility;

      const newMedicines = facility.medicines.map((med) => {
        if (med.id !== medicineId) return med;

        const newDaily = dailyConsumption !== undefined ? dailyConsumption : med.dailyConsumption;
        const newDaysRemaining = newDaily > 0 ? Math.round(currentStock / newDaily) : 999;
        const autoCritical = newDaysRemaining <= 3;
        const status: MedicineStockStatus = autoCritical ? 'critical' : newDaysRemaining <= 7 ? 'low' : 'normal';
        const hasShortage = isShortageAlert !== undefined ? isShortageAlert : autoCritical || currentStock < med.minBuffer;

        return {
          ...med,
          currentStock,
          dailyConsumption: newDaily,
          daysRemaining: newDaysRemaining,
          status,
          activeShortage: hasShortage,
          shortageReason: hasShortage ? shortageReason || med.shortageReason || 'Critical shortage reported by clinician' : undefined,
          lastUpdated: 'Just now',
        };
      });

      updatedProfile = {
        ...facility,
        medicines: newMedicines,
        lastReportedAt: 'Just now',
      };
      return updatedProfile;
    });

    writeStorage(SUPPLY_PROFILES_KEY, newProfiles);

    // If shortage flagged, create a ShortageReport
    if (isShortageAlert && updatedProfile) {
      const activeProf: HospitalSupplyProfile = updatedProfile;
      const targetMed = activeProf.medicines.find((m: MedicineItem) => m.id === medicineId);
      if (targetMed) {
        DemoDB.reportShortage({
          hospitalId: activeProf.hospitalId,
          hospitalName: activeProf.hospitalName,
          district: activeProf.district,
          medicineId: targetMed.id,
          medicineName: targetMed.name,
          severity: targetMed.daysRemaining <= 1 ? 'critical' : 'high',
          currentStock,
          minBuffer: targetMed.minBuffer,
          daysRemaining: targetMed.daysRemaining,
          reason: shortageReason || 'Immediate shortage reported via AushadhiNet clinician portal.',
          reportedBy: 'Staff Clinician / Pharmacist',
        });
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:supply-updated', { detail: { hospitalId, medicineId } }));
    }

    return updatedProfile || profiles[0];
  },

  getShortageReports: (): ShortageReport[] => {
    const stored = readStorage<ShortageReport[]>(SHORTAGE_REPORTS_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    writeStorage(SHORTAGE_REPORTS_KEY, DEFAULT_SHORTAGE_REPORTS);
    return DEFAULT_SHORTAGE_REPORTS;
  },

  reportShortage: (report: Omit<ShortageReport, 'id' | 'reportedAt' | 'resolved'>): ShortageReport => {
    const existing = DemoDB.getShortageReports();
    const newReport: ShortageReport = {
      ...report,
      id: `short-${Date.now().toString().slice(-6)}`,
      reportedAt: 'Today, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };
    const updated = [newReport, ...existing];
    writeStorage(SHORTAGE_REPORTS_KEY, updated);

    // Also auto-generate a redistribution suggestion if one doesn't exist
    DemoDB.generateAutoRebalances();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:shortage-reported', { detail: newReport }));
    }
    return newReport;
  },

  resolveShortage: (shortageId: string): boolean => {
    const reports = DemoDB.getShortageReports();
    const updated = reports.map((r) => (r.id === shortageId ? { ...r, resolved: true } : r));
    writeStorage(SHORTAGE_REPORTS_KEY, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:shortage-resolved', { detail: { id: shortageId } }));
    }
    return true;
  },

  getRedistributionOrders: (): RedistributionOrder[] => {
    const stored = readStorage<RedistributionOrder[]>(REDISTRIBUTION_ORDERS_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    writeStorage(REDISTRIBUTION_ORDERS_KEY, DEFAULT_REDISTRIBUTION_ORDERS);
    return DEFAULT_REDISTRIBUTION_ORDERS;
  },

  approveRedistributionOrder: (orderId: string): RedistributionOrder | null => {
    const orders = DemoDB.getRedistributionOrders();
    let approved: RedistributionOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === orderId || o.orderNumber === orderId) {
        approved = { ...o, status: 'approved' as const, updatedAt: 'Just now' };
        return approved;
      }
      return o;
    });
    writeStorage(REDISTRIBUTION_ORDERS_KEY, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:rebalance-updated', { detail: approved }));
    }
    return approved;
  },

  dispatchRedistributionOrder: (orderId: string): RedistributionOrder | null => {
    const orders = DemoDB.getRedistributionOrders();
    let dispatched: RedistributionOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === orderId || o.orderNumber === orderId) {
        dispatched = { ...o, status: 'in_transit' as const, updatedAt: 'Just now' };
        return dispatched;
      }
      return o;
    });
    writeStorage(REDISTRIBUTION_ORDERS_KEY, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:rebalance-updated', { detail: dispatched }));
    }
    return dispatched;
  },

  receiveRedistributionOrder: (
    orderId: string,
    otp: string
  ): { success: boolean; message: string; order?: RedistributionOrder } => {
    const orders = DemoDB.getRedistributionOrders();
    const target = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!target) {
      return { success: false, message: 'Transfer order not found in manifest.' };
    }

    if (target.otpCode.trim() !== otp.trim()) {
      return { success: false, message: 'Invalid OTP verification code. Delivery cannot be verified.' };
    }

    const updated = orders.map((o) => (o.id === target.id ? { ...o, status: 'delivered' as const, updatedAt: 'Just now' } : o));
    writeStorage(REDISTRIBUTION_ORDERS_KEY, updated);

    // Apply delivery: increase recipient hospital's stock!
    const profiles = DemoDB.getAllSupplyProfiles();
    const updatedProfiles = profiles.map((facility) => {
      if (facility.hospitalId === target.targetHospitalId) {
        const newMeds = facility.medicines.map((m) => {
          if (m.id === target.medicineId) {
            const newStock = m.currentStock + target.quantity;
            const newDays = m.dailyConsumption > 0 ? Math.round(newStock / m.dailyConsumption) : 999;
            return {
              ...m,
              currentStock: newStock,
              daysRemaining: newDays,
              status: (newDays <= 3 ? 'critical' : newDays <= 7 ? 'low' : 'normal') as MedicineStockStatus,
              activeShortage: newDays <= 3,
              shortageReason: newDays <= 3 ? m.shortageReason : undefined,
              lastUpdated: 'Inward dispatch verified',
            };
          }
          return m;
        });
        return { ...facility, medicines: newMeds, lastReportedAt: 'Just now' };
      }
      return facility;
    });

    writeStorage(SUPPLY_PROFILES_KEY, updatedProfiles);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartcare:rebalance-delivered', { detail: { order: target } }));
      window.dispatchEvent(new CustomEvent('smartcare:supply-updated', { detail: { hospitalId: target.targetHospitalId } }));
    }

    return {
      success: true,
      message: `Verified! Inward transfer of ${target.quantity} ${target.unit} of ${target.medicineName} received into stock.`,
      order: { ...target, status: 'delivered' },
    };
  },

  generateAutoRebalances: (): RedistributionOrder[] => {
    const profiles = DemoDB.getAllSupplyProfiles();
    const existingOrders = DemoDB.getRedistributionOrders();
    const newOrders: RedistributionOrder[] = [...existingOrders];

    // Find shortages in PHCs / Hospitals
    const nonWarehouses = profiles.filter((p) => p.tier !== 'warehouse');
    const warehouse = profiles.find((p) => p.tier === 'warehouse') || profiles[profiles.length - 1];

    nonWarehouses.forEach((hosp) => {
      hosp.medicines.forEach((med) => {
        if (med.daysRemaining <= 2 || med.activeShortage) {
          // Check if an active order already exists
          const existing = newOrders.find(
            (o) =>
              o.targetHospitalId === hosp.hospitalId &&
              o.medicineId === med.id &&
              ['suggested', 'approved', 'in_transit'].includes(o.status)
          );

          if (!existing && warehouse) {
            const rebalQty = Math.max(med.minBuffer * 2, 50);
            const orderNum = `REBAL-2026-${Math.floor(100 + Math.random() * 900)}`;
            newOrders.push({
              id: `rebal-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
              orderNumber: orderNum,
              sourceHospitalId: warehouse.hospitalId,
              sourceHospitalName: warehouse.hospitalName,
              targetHospitalId: hosp.hospitalId,
              targetHospitalName: hosp.hospitalName,
              medicineId: med.id,
              medicineName: med.name,
              quantity: rebalQty,
              unit: med.unit,
              status: 'suggested',
              priority: med.daysRemaining <= 1 ? 'CRITICAL' : 'HIGH',
              routeDistanceKm: Number((12 + Math.random() * 15).toFixed(1)),
              estimatedTransitMins: Math.round(25 + Math.random() * 20),
              otpCode: String(Math.floor(100000 + Math.random() * 900000)),
              createdAt: 'Just now',
            });
          }
        }
      });
    });

    writeStorage(REDISTRIBUTION_ORDERS_KEY, newOrders);
    return newOrders;
  },

  getDistrictSupplyAggregate: (district = 'Hyderabad'): DistrictSupplyAggregate => {
    const profiles = DemoDB.getAllSupplyProfiles();
    const shortages = DemoDB.getShortageReports().filter((s) => !s.resolved);
    const orders = DemoDB.getRedistributionOrders();

    // Clinical facilities (exclude central warehouse for accurate hospital occupancy & consumption stats)
    const careFacilities = profiles.filter((p) => p.tier !== 'warehouse');

    // Totals
    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalIcu = 0;
    let occupiedIcu = 0;
    let totalOxyAvailable = 0;
    let totalOxyMax = 0;

    careFacilities.forEach((f) => {
      totalBeds += f.bedsTotal;
      occupiedBeds += f.bedsOccupied;
      totalIcu += f.icuTotal;
      occupiedIcu += f.icuOccupied;
      totalOxyAvailable += f.oxygenCylindersAvailable;
      totalOxyMax += f.oxygenCylindersTotal;
    });

    const totalBedsOccupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const totalIcuOccupancyPercent = totalIcu > 0 ? Math.round((occupiedIcu / totalIcu) * 100) : 0;
    const oxygenAvailabilityPercent = totalOxyMax > 0 ? Math.round((totalOxyAvailable / totalOxyMax) * 100) : 0;

    // Medicine Aggregations across hospitals
    const medMap: Record<
      string,
      {
        name: string;
        category: string;
        totalStock: number;
        totalDaily: number;
        reportingCount: number;
        shortageHospitals: string[];
      }
    > = {};

    careFacilities.forEach((f) => {
      f.medicines.forEach((m) => {
        if (!medMap[m.id]) {
          medMap[m.id] = {
            name: m.name,
            category: m.category,
            totalStock: 0,
            totalDaily: 0,
            reportingCount: 0,
            shortageHospitals: [],
          };
        }
        medMap[m.id].totalStock += m.currentStock;
        medMap[m.id].totalDaily += m.dailyConsumption;
        medMap[m.id].reportingCount += 1;
        if (m.daysRemaining <= 3 || m.activeShortage) {
          medMap[m.id].shortageHospitals.push(f.hospitalName);
        }
      });
    });

    const medicineSummaries: DistrictMedicineSummary[] = Object.entries(medMap).map(([id, data]) => {
      const avgDays = data.totalDaily > 0 ? Math.round(data.totalStock / data.totalDaily) : 999;
      const hasCriticalShortage = data.shortageHospitals.length > 0 || avgDays <= 3;
      const status: MedicineStockStatus = hasCriticalShortage ? 'critical' : avgDays <= 7 ? 'low' : 'normal';

      return {
        medicineId: id,
        medicineName: data.name,
        category: data.category,
        totalStock: data.totalStock,
        avgDailyConsumption: data.totalDaily,
        districtAvgDaysRemaining: avgDays,
        hospitalsReporting: data.reportingCount,
        hospitalsInShortage: data.shortageHospitals.length,
        criticalHospitals: data.shortageHospitals,
        status,
      };
    });

    // District-wide average stock days
    const totalDays = medicineSummaries.reduce((sum, m) => sum + (m.districtAvgDaysRemaining < 100 ? m.districtAvgDaysRemaining : 30), 0);
    const avgStockDaysRemaining = medicineSummaries.length > 0 ? Math.round(totalDays / medicineSummaries.length) : 14;

    const criticalAlertsCount = medicineSummaries.filter((m) => m.status === 'critical').length;
    const pendingRebalances = orders.filter((o) => o.status === 'suggested').length;

    return {
      district: 'Hyderabad & Rangareddy Central',
      state: 'Telangana',
      totalFacilities: profiles.length,
      reportingFacilities: profiles.length,
      criticalAlertsCount,
      avgStockDaysRemaining,
      totalBedsOccupancyPercent,
      totalIcuOccupancyPercent,
      oxygenAvailabilityPercent,
      medicineSummaries,
      facilityProfiles: profiles,
      pendingRebalances,
      lastAggregatedAt: 'Today, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  },
};

