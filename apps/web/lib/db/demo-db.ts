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
    { id: 'p-don-1', type: 'blood', mode: 'give', name: 'Ravi Kumar', group: 'O+', city: 'Hyderabad', status: 'Available', date: 'Today' },
    { id: 'p-don-2', type: 'blood', mode: 'give', name: 'Priya M.', group: 'AB−', city: 'Secunderabad', status: 'Available', date: 'Yesterday' },
    { id: 'p-don-3', type: 'blood', mode: 'receive', name: 'Arun V.', group: 'B+', city: 'Hyderabad', urgency: 'Urgent', status: 'Pending', date: 'Today' },
    { id: 'p-don-4', type: 'organ', mode: 'give', name: 'K. Sharma (Pledged)', group: 'Kidney', city: 'Hyderabad', status: 'Registered', date: '3 days ago' },
    { id: 'p-don-5', type: 'organ', mode: 'give', name: 'Anita D. (Pledged)', group: 'Cornea', city: 'Hyderabad', status: 'Registered', date: '1 week ago' },
    { id: 'p-don-6', type: 'organ', mode: 'receive', name: 'Mohan R.', group: 'Liver', city: 'Secunderabad', urgency: 'Urgent', status: 'Pending', date: 'Yesterday' },
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
    const users = getAllUsers();
    const user = users[email.toLowerCase()];
    const hospitalMatches = role === 'patient' || !hospital || String(user?.hospital || '').toLowerCase() === String(hospital).toLowerCase();
    if (user && user.password === password && user.role === role && hospitalMatches) {
      return { success: true, user: { email: user.email, role: user.role, hospital: user.hospital || '', country: user.country, state: user.state || '', city: user.city || '' } };
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
    const users = getAllUsers();
    const email = data.email.toLowerCase();
    if (users[email]) return { success: false, error: 'An account with this email already exists.' };
    const newUser = { email, password: data.password, role: 'patient' as const, name: data.name, hospital: '', country: 'India', state: 'Telangana', city: data.city || 'Hyderabad' };
    users[email] = newUser;
    saveRegisteredUsers(users);
    return { success: true, user: { email, role: 'patient' as const, name: data.name } };
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
};
