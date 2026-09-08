'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserRole,
  QueueItem,
  PatientVisit,
  AppointmentBooking,
  AuthState,
  QueueMetrics,
  GeoCoordinates,
  HospitalCentre,
  CareTeamMember,
  AppointmentSlot,
  AmbulanceBooking,
  PharmacyOrder,
} from '@smartcare/types';
import { DemoDB } from '@/lib/db/demo-db';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Session {
  email: string;
  role: UserRole;
  hospital: string;
  country: string;
  state: string;
  city: string;
  expiresAt: number;
}

export interface AppState {
  // Session
  isLogged: boolean;
  loggedEmail: string;
  loggedRole: UserRole | '';
  loggedHospital: string;
  loggedCountry: string;
  loggedState: string;
  loggedCity: string;
  sessionExpiresAt: number;
  auth: AuthState;

  // Patient booking
  step: number;
  patientData: AppointmentBooking;
  patientVisits: PatientVisit[];
  userCoords: GeoCoordinates | null;
  tempHospitals: HospitalCentre[];
  searchRadius: number;
  careResultsFetchedAt: string;

  // Queue (full list, scoped in selectors)
  queue: QueueItem[];

  // Ambulance & Emergency Fleet
  activeAmbulance: AmbulanceBooking | null;

  // Pharmacy Orders
  pharmacyOrders: PharmacyOrder[];

  // UI
  theme: 'light' | 'dark';
  toastMessage: string | null;
  toastType: 'info' | 'success' | 'error';
}

export interface AppActions {
  // Auth
  login: (email: string, role: UserRole, profile: { hospital: string; country: string; state: string; city: string }) => void;
  logout: () => void;
  setAuthTarget: (role: UserRole) => void;

  // Patient data
  setStep: (step: number) => void;
  updatePatientData: (key: keyof AppointmentBooking, value: string | string[]) => void;
  setUserCoords: (coords: GeoCoordinates | null) => void;
  setTempHospitals: (hospitals: HospitalCentre[], radius?: number) => void;
  resetPatient: () => void;
  recordPatientVisit: (visit: PatientVisit) => void;

  // Queue & Cancellations
  setQueue: (queue: QueueItem[]) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  cancelAppointment: (id: string, cancelledBy?: 'patient' | 'doctor', reason?: string) => Promise<{ success: boolean; error?: string }>;
  claimRefund: (id: string) => Promise<{ success: boolean; ref?: string; error?: string }>;

  // Ambulance
  setActiveAmbulance: (amb: AmbulanceBooking | null) => void;
  bookAmbulance: (req: Partial<AmbulanceBooking>) => AmbulanceBooking;
  cancelAmbulance: (id: string, reason?: string) => { success: boolean; error?: string };

  // Pharmacy
  setPharmacyOrders: (orders: PharmacyOrder[]) => void;
  createPharmacyOrder: (order: Partial<PharmacyOrder>) => PharmacyOrder;
  updatePharmacyOrderStatus: (id: string, nextStatus: PharmacyOrder['status']) => { success: boolean; error?: string };

  // UI
  setTheme: (theme: 'light' | 'dark') => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearToast: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const emptyPatientData = (): AppointmentBooking => ({
  name: '', age: '', gender: '', doctorPref: '', department: '',
  doctorId: '', doctorName: '', consultationType: '', appointmentDate: '',
  appointmentSlot: '', area: '', symptoms: '', symptomSelections: [],
  customSymptomTags: [], customSymptoms: '', hospital: '', country: '',
  state: '', city: '',
});

const DEMO_VISITS: PatientVisit[] = [
  { id: 'visit-demo-001', hospital: 'SmartCare Community Hospital', city: 'Hyderabad', reason: 'General consultation', date: '18 Jul 2026', status: 'Completed', reference: 'SC-DEMO18' },
  { id: 'visit-demo-002', hospital: 'Green Cross Medical Centre', city: 'Hyderabad', reason: 'Follow-up consultation', date: '04 Jun 2026', status: 'Completed', reference: 'SC-DEMO04' },
];

export const CARE_TEAM: CareTeamMember[] = [
  { id: 'meera-shah', name: 'Dr Meera Shah', department: 'General medicine', specialty: 'Internal medicine', room: 'Consultation 01', availability: 'Available' },
  { id: 'arjun-rao', name: 'Dr Arjun Rao', department: 'General medicine', specialty: 'Family care', room: 'Consultation 02', availability: 'Available' },
  { id: 'nisha-verma', name: 'Dr Nisha Verma', department: 'Paediatrics', specialty: 'Child health', room: 'Consultation 03', availability: 'Available from 11:30' },
  { id: 'kavya-iyer', name: 'Dr Kavya Iyer', department: "Women's health", specialty: 'Gynaecology', room: 'Consultation 04', availability: 'Available from 14:00' },
  { id: 'vikram-desai', name: 'Dr Vikram Desai', department: 'Orthopaedics', specialty: 'Bone and joint care', room: 'Consultation 05', availability: 'Available tomorrow' },
];

export function getAppointmentSlots(): AppointmentSlot[] {
  const dateKey = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  return [
    { value: `${dateKey(0)}|Next available`, date: dateKey(0), slot: 'Next available', label: 'Today - next available' },
    { value: `${dateKey(0)}|16:30`, date: dateKey(0), slot: '16:30', label: 'Today - 4:30 pm' },
    { value: `${dateKey(1)}|09:30`, date: dateKey(1), slot: '09:30', label: 'Tomorrow - 9:30 am' },
    { value: `${dateKey(1)}|11:00`, date: dateKey(1), slot: '11:00', label: 'Tomorrow - 11:00 am' },
    { value: `${dateKey(2)}|14:30`, date: dateKey(2), slot: '14:30', label: 'In two days - 2:30 pm' },
  ];
}

// ─── Queue selectors ──────────────────────────────────────────────────────────

export function queueStatus(item: QueueItem): string {
  return String(item?.status || 'waiting').toLowerCase();
}

export function queuePriority(item: QueueItem): number {
  return ({ red: 0, yellow: 1, green: 2 } as Record<string, number>)[String(item?.triage || 'Green').toLowerCase()] ?? 3;
}

export function sortQueue(items: QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => {
    const aRank = ({ in_progress: 0, called: 1, waiting: 2 } as Record<string, number>)[queueStatus(a)] ?? 3;
    const bRank = ({ in_progress: 0, called: 1, waiting: 2 } as Record<string, number>)[queueStatus(b)] ?? 3;
    return aRank - bRank || queuePriority(a) - queuePriority(b) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function scopeQueue(fullQueue: QueueItem[], role: UserRole | '', hospital: string, city: string, email: string, visits: PatientVisit[]): QueueItem[] {
  const active = fullQueue.filter(
    (item) => !['completed', 'cancelled', 'withdrawn', 'no-show'].includes(queueStatus(item))
  );
  if (role === 'patient') {
    const visitIds = new Set(visits.map((v) => String(v.id)));
    return active.filter((item) => String(item.patientEmail || '').toLowerCase() === email.toLowerCase() || visitIds.has(String(item.id)));
  }
  if (role !== 'staff' && hospital && city) {
    return active.filter(
      (item) => (item.queueHospital || item.hospital) === hospital &&
        String(item.city || 'Hyderabad').toLowerCase() === String(city || 'Hyderabad').toLowerCase()
    );
  }
  return active;
}

export function getQueueMetrics(queue: QueueItem[]): QueueMetrics {
  const waits = queue.map((item) => Math.max(0, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000)));
  return {
    waiting: queue.length,
    waitingOnly: queue.filter((i) => queueStatus(i) === 'waiting').length,
    called: queue.filter((i) => queueStatus(i) === 'called').length,
    inProgress: queue.filter((i) => queueStatus(i) === 'in_progress').length,
    priority: queue.filter((i) => i.triage === 'Red').length,
    averageWait: waits.length ? Math.round(waits.reduce((s, v) => s + v, 0) / waits.length) : 0,
    revenue: queue.reduce((s, i) => s + (Number(i.fee) || 0), 0),
  };
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      isLogged: false,
      loggedEmail: '',
      loggedRole: '',
      loggedHospital: '',
      loggedCountry: '',
      loggedState: '',
      loggedCity: '',
      sessionExpiresAt: 0,
      auth: { targetRole: 'patient' },

      step: 1,
      patientData: emptyPatientData(),
      patientVisits: [],
      userCoords: null,
      tempHospitals: [],
      searchRadius: 0,
      careResultsFetchedAt: '',

      queue: [],
      activeAmbulance: null,
      pharmacyOrders: [],
      theme: 'light',
      toastMessage: null,
      toastType: 'info',

      // ── Auth actions ─────────────────────────────────────────────────────
      login: (email, role, profile) => {
        const isPatient = role === 'patient';
        const expiresAt = Date.now() + SESSION_TTL;

        // Load patient-specific data from storage
        let patientVisits: PatientVisit[] = [];
        let patientData = emptyPatientData();

        if (isPatient) {
          const visitKey = `smartcare.patientVisits:${email.toLowerCase()}`;
          const draftKey = `smartcare.patientDraft:${email.toLowerCase()}`;
          try {
            const storedVisits = JSON.parse(localStorage.getItem(visitKey) || 'null');
            patientVisits = Array.isArray(storedVisits)
              ? storedVisits
              : email.toLowerCase() === 'patient@smartcare.demo'
              ? [...DEMO_VISITS]
              : [];
            const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
            if (draft?.patientData) patientData = { ...emptyPatientData(), ...draft.patientData };
          } catch {}
        }

        set({
          isLogged: true,
          loggedEmail: email,
          loggedRole: role,
          loggedHospital: profile.hospital,
          loggedCountry: profile.country,
          loggedState: profile.state,
          loggedCity: profile.city,
          sessionExpiresAt: expiresAt,
          patientVisits,
          patientData,
        });
      },

      logout: () => {
        set({
          isLogged: false,
          loggedEmail: '',
          loggedRole: '',
          loggedHospital: '',
          loggedCountry: '',
          loggedState: '',
          loggedCity: '',
          sessionExpiresAt: 0,
          queue: [],
          patientVisits: [],
          patientData: emptyPatientData(),
        });
      },

      setAuthTarget: (role) => set((s) => ({ auth: { ...s.auth, targetRole: role } })),

      // ── Patient actions ──────────────────────────────────────────────────
      setStep: (step) => {
        const clamped = Math.max(1, Math.min(4, step));
        set({ step: clamped });
      },

      updatePatientData: (key, value) => {
        const { patientData, loggedEmail } = get();
        const next = { ...patientData, [key]: value };
        set({ patientData: next });
        // Persist draft
        try {
          const draftKey = `smartcare.patientDraft:${loggedEmail.toLowerCase() || 'guest'}`;
          const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
          localStorage.setItem(draftKey, JSON.stringify({ ...draft, patientData: next }));
        } catch {}
      },

      setUserCoords: (coords) => set({ userCoords: coords }),

      setTempHospitals: (hospitals, radius = 0) => set({ tempHospitals: hospitals, searchRadius: radius, careResultsFetchedAt: new Date().toISOString() }),

      resetPatient: () => {
        set({ step: 1, patientData: emptyPatientData(), userCoords: null, tempHospitals: [], searchRadius: 0, careResultsFetchedAt: '' });
      },

      recordPatientVisit: (visit) => {
        const { patientVisits, loggedEmail } = get();
        const next = [visit, ...patientVisits.filter((v) => String(v.id) !== String(visit.id))].slice(0, 12);
        set({ patientVisits: next });
        try {
          const key = `smartcare.patientVisits:${loggedEmail.toLowerCase()}`;
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
      },

      // ── Queue actions ────────────────────────────────────────────────────
      setQueue: (fullQueue) => {
        const { loggedRole, loggedHospital, loggedCity, loggedEmail, patientVisits } = get();
        const scoped = scopeQueue(fullQueue, loggedRole as UserRole, loggedHospital, loggedCity, loggedEmail, patientVisits);
        set({ queue: scoped });
      },

      updateQueueItem: (id, updates) => {
        set((s) => ({
          queue: s.queue.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        }));
      },

      cancelAppointment: async (id, cancelledBy = 'patient', reason = 'Schedule conflict') => {
        const res = await DemoDB.cancelAppointment(id, cancelledBy, reason);
        if (res.success) {
          const fresh = await DemoDB.fetchQueue();
          get().setQueue(fresh);
          const historyVisit = get().patientVisits.find((v) => String(v.id) === String(id));
          if (historyVisit) {
            get().recordPatientVisit({
              ...historyVisit,
              status: 'Cancelled',
              cancelledBy,
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
              refundStatus: cancelledBy === 'doctor' ? 'eligible' : 'none',
            });
          }
        }
        return res;
      },

      claimRefund: async (id) => {
        const res = await DemoDB.claimRefund(id);
        if (res.success && res.ref) {
          const historyVisit = get().patientVisits.find((v) => String(v.id) === String(id));
          if (historyVisit) {
            get().recordPatientVisit({
              ...historyVisit,
              refundStatus: 'claimed',
              refundRef: res.ref,
              refundClaimedAt: new Date().toISOString(),
            });
          }
          const fresh = await DemoDB.fetchQueue();
          get().setQueue(fresh);
        }
        return res;
      },

      // ── Ambulance actions ─────────────────────────────────────────────────
      setActiveAmbulance: (amb) => set({ activeAmbulance: amb }),
      bookAmbulance: (req) => {
        const amb = DemoDB.bookAmbulance(req);
        set({ activeAmbulance: amb });
        return amb;
      },
      cancelAmbulance: (id, reason) => {
        const res = DemoDB.cancelAmbulance(id, reason);
        if (res.success) {
          set({ activeAmbulance: null });
        }
        return res;
      },

      // ── Pharmacy actions ──────────────────────────────────────────────────
      setPharmacyOrders: (orders) => set({ pharmacyOrders: orders }),
      createPharmacyOrder: (order) => {
        const newOrder = DemoDB.createPharmacyOrder(order);
        set({ pharmacyOrders: DemoDB.getPharmacyOrders() });
        return newOrder;
      },
      updatePharmacyOrderStatus: (id, nextStatus) => {
        const res = DemoDB.updatePharmacyOrderStatus(id, nextStatus);
        if (res.success) {
          set({ pharmacyOrders: DemoDB.getPharmacyOrders() });
        }
        return res;
      },

      // ── UI actions ───────────────────────────────────────────────────────
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
        try { localStorage.setItem('smartcare.theme', theme); } catch {}
      },

      showToast: (message, type = 'info') => {
        set({ toastMessage: message, toastType: type });
        setTimeout(() => set({ toastMessage: null }), 3500);
      },

      clearToast: () => set({ toastMessage: null }),
    }),
    {
      name: 'smartcare.session',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      // Only persist session data, not UI state
      partialize: (state) => ({
        isLogged: state.isLogged,
        loggedEmail: state.loggedEmail,
        loggedRole: state.loggedRole,
        loggedHospital: state.loggedHospital,
        loggedCountry: state.loggedCountry,
        loggedState: state.loggedState,
        loggedCity: state.loggedCity,
        sessionExpiresAt: state.sessionExpiresAt,
        auth: state.auth,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Expire sessions
        if (state?.sessionExpiresAt && state.sessionExpiresAt < Date.now()) {
          state.isLogged = false;
          state.loggedEmail = '';
          state.loggedRole = '';
        }
        // Apply theme
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);

// ─── Convenience hooks ────────────────────────────────────────────────────────

export const useSession = () =>
  useAppStore(
    useShallow((s) => ({
      isLogged: s.isLogged,
      email: s.loggedEmail,
      role: s.loggedRole as UserRole | '',
      hospital: s.loggedHospital,
      country: s.loggedCountry,
      state: s.loggedState,
      city: s.loggedCity,
    }))
  );

export const useQueue = () => {
  const queue = useAppStore((s) => s.queue);
  const metrics = useMemo(() => getQueueMetrics(queue), [queue]);
  const sorted = useMemo(() => sortQueue(queue), [queue]);
  const nextPatient = useMemo(
    () => sorted.find((item) => ['in_progress', 'called', 'waiting'].includes(queueStatus(item))) || null,
    [sorted]
  );
  const cancelledQueue = useMemo(
    () => DemoDB.getCancelledAppointments(),
    [queue]
  );
  return { queue, metrics, sorted, nextPatient, cancelledQueue };
};

export const usePatient = () =>
  useAppStore(
    useShallow((s) => ({
      step: s.step,
      patientData: s.patientData,
      patientVisits: s.patientVisits,
      userCoords: s.userCoords,
      tempHospitals: s.tempHospitals,
    }))
  );

export const useAmbulance = () => {
  const activeAmbulance = useAppStore((s) => s.activeAmbulance);
  const bookAmbulance = useAppStore((s) => s.bookAmbulance);
  const cancelAmbulance = useAppStore((s) => s.cancelAmbulance);
  return { activeAmbulance, bookAmbulance, cancelAmbulance };
};

export const usePharmacy = () => {
  const orders = useAppStore((s) => s.pharmacyOrders);
  const createOrder = useAppStore((s) => s.createPharmacyOrder);
  const updateStatus = useAppStore((s) => s.updatePharmacyOrderStatus);
  return { orders, createOrder, updateStatus };
};
