// ─── SmartCare Shared Type Contracts ────────────────────────────────────────
// Phase 1 of stackshift.md — TypeScript Data Contract Extraction

export type TriagePriority = 'Red' | 'Yellow' | 'Green' | 'Unassessed';
export type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled' | 'withdrawn' | 'no-show';
export type UserRole = 'patient' | 'doctor' | 'staff';
export type DonationType = 'blood' | 'organ';
export type DonationMode = 'offer' | 'request' | 'give' | 'receive';

// ─── Queue & Appointments ────────────────────────────────────────────────────

export interface QueueItem {
  id: string;
  name: string;
  age: number;
  gender?: string;
  // Appointment fields
  department?: string;
  doctorId?: string;
  doctorName?: string;
  doctorPref?: string;
  doctor_pref?: string;
  consultationType?: string;
  consultation_type?: string;
  appointmentDate?: string;
  appointment_date?: string;
  appointmentSlot?: string;
  appointment_slot?: string;
  // Location fields
  area?: string;
  hospital: string;
  queueHospital?: string;
  requestedHospital?: string;
  country: string;
  state?: string;
  city?: string;
  // Clinical fields
  symptoms: string;
  problem?: string;
  triage: TriagePriority;
  fee: number;
  status: QueueStatus;
  // Tracking
  patientEmail?: string;
  patientAuthId?: string;
  demoMirrored?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AppointmentBooking {
  name: string;
  age: string;
  gender: string;
  doctorPref: string;
  department: string;
  doctorId: string;
  doctorName: string;
  consultationType: string;
  appointmentDate: string;
  appointmentSlot: string;
  area: string;
  symptoms: string;
  symptomSelections: string[];
  customSymptomTags: string[];
  customSymptoms: string;
  hospital: string;
  country: string;
  state: string;
  city: string;
  lastBookingId?: string;
}

export type DonationPost = PatientDonationPost;

export interface AppointmentSlot {
  value: string;
  date: string;
  slot: string;
  label: string;
}

export interface CareTeamMember {
  id: string;
  name: string;
  department: string;
  specialty: string;
  room: string;
  availability: string;
}

// ─── Patient Profile ─────────────────────────────────────────────────────────

export interface PatientProfile {
  email: string;
  name: string;
  age: string;
  gender: string;
  city: string;
  country: string;
  state: string;
  hospital?: string;
}

export interface PatientVisit {
  id: string;
  hospital: string;
  city: string;
  reason: string;
  date: string;
  status: string;
  reference: string;
  department?: string;
  doctorName?: string;
  consultationType?: string;
  appointmentDate?: string;
  appointmentSlot?: string;
}

// ─── Medical History (Passport) ──────────────────────────────────────────────

export interface PreviousProviderInfo {
  doctorName: string;
  hospitalName: string;
  city: string;
  contactPhone: string;
}

export interface DiseaseConditionItem {
  id: string;
  diseaseName: string;
  diagnosedSince: string;
  status: 'Active' | 'Managed' | 'In Remission';
}

export interface PersonalPreferenceItem {
  id: string;
  category: string;
  preference: string;
}

export interface MedicationItem {
  id: string;
  medicineName: string;
  dosage: string;
  conditionTreated: string;
  notes?: string;
}

export interface AllergyAvoidItem {
  id: string;
  substance: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening';
  reactionDescription: string;
}

export interface CareConditionItem {
  id: string;
  category: string;
  instruction: string;
}

export interface EmergencyProtocolItem {
  id: string;
  triggerCondition: string;
  actionSteps: string;
}

export interface PatientMedicalHistory {
  lastUpdated: string;
  previousProvider: PreviousProviderInfo;
  diseases: DiseaseConditionItem[];
  personalPreferences: PersonalPreferenceItem[];
  effectiveMedications: MedicationItem[];
  allergiesAndAvoid: AllergyAvoidItem[];
  careConditions: CareConditionItem[];
  emergencyProtocols: EmergencyProtocolItem[];
}

// ─── Prescriptions ───────────────────────────────────────────────────────────

export interface PrescriptionMedicine {
  name: string;
  strength: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  visitId?: string;
  assessment: string;
  medicines: PrescriptionMedicine[];
  labSummary?: string;
  providerName?: string;
  issuedAt?: string;
  demo?: boolean;
}

// ─── Donations ───────────────────────────────────────────────────────────────

export interface HospitalDonationPost {
  id: string;
  type: DonationType;
  mode: 'offer' | 'request';
  group: string;
  units?: number;
  hospital: string;
  city: string;
  urgency?: 'Routine' | 'Urgent' | 'Planned' | 'Emergency';
  notes?: string;
  date: string;
}

export interface PatientDonationPost {
  id: string;
  type: DonationType;
  mode: 'give' | 'receive';
  name: string;
  group: string;
  city: string;
  urgency?: string;
  status: string;
  date?: string;
  author?: string;
  created_at?: string;
}

export interface DonationsData {
  hospitalPosts: HospitalDonationPost[];
  patientPosts: PatientDonationPost[];
}

export interface BloodDonationCentre {
  id: string;
  name: string;
  area: string;
  city: string;
  hours?: string;
  note?: string;
  supported_groups: string[];
}

// ─── Hospital / Location ─────────────────────────────────────────────────────

export interface HospitalCentre {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  type?: string;
  openingHours?: string;
  source?: string;
  area?: string;
  city?: string;
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
  bbox?: string[];
  displayName?: string;
  country?: string;
  state?: string;
  city?: string;
}

// ─── Auth Session ────────────────────────────────────────────────────────────

export interface UserSession {
  email: string;
  role: UserRole;
  hospital: string;
  country: string;
  state: string;
  city: string;
  expiresAt: number;
}

export interface AuthState {
  targetRole: UserRole;
}

// ─── Queue Metrics ───────────────────────────────────────────────────────────

export interface QueueMetrics {
  waiting: number;
  waitingOnly: number;
  called: number;
  inProgress: number;
  priority: number;
  averageWait: number;
  revenue: number;
}

// ─── Professional Profile ────────────────────────────────────────────────────

export interface ProfessionalProfile {
  id?: string;
  email: string;
  hospital: string;
  role: UserRole;
  country: string;
  state?: string;
  city?: string;
}

// ─── Room Status ─────────────────────────────────────────────────────────────

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface HospitalRoom {
  id: string;
  name: string;
  type: string;
  status: RoomStatus;
}

// ─── DonationRecord (stackshift alias) ──────────────────────────────────────

export type DonationRecord = HospitalDonationPost | PatientDonationPost;
