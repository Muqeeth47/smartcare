'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserRound,
  Mail,
  Phone,
  Calendar,
  MapPin,
  HeartPulse,
  Droplets,
  ShieldCheck,
  Sparkles,
  Save,
  CheckCircle2,
  CalendarPlus,
  FileText,
  Clock,
  AlertCircle,
  Building,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { usePatient, useSession, useAppStore } from '@/lib/store/app-store';
import { DemoDB } from '@/lib/db/demo-db';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

export function PatientProfileSection() {
  const { patientData, patientVisits } = usePatient();
  const { email } = useSession();
  const { updatePatientData, showToast } = useAppStore();

  const [name, setName] = useState(patientData.name || 'Asha Rao');
  const [age, setAge] = useState(patientData.age || '32');
  const [gender, setGender] = useState(patientData.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState(patientData.bloodGroup || 'O+');
  const [phone, setPhone] = useState(patientData.phone || '+91 98765 43210');
  const [city, setCity] = useState(patientData.city || 'Hyderabad');
  const [stateName, setStateName] = useState(patientData.state || 'Telangana');
  const [hospital, setHospital] = useState(patientData.hospital || 'SmartCare Community Hospital');
  const [emergencyContact, setEmergencyContact] = useState(patientData.emergencyContact || 'Suresh Rao (Spouse)');
  const [emergencyPhone, setEmergencyPhone] = useState(patientData.emergencyPhone || '+91 98765 12345');
  const [allergies, setAllergies] = useState(patientData.allergies || 'No known drug allergies (NKDA)');
  const [isDonor, setIsDonor] = useState(Boolean(patientData.isDonor ?? true));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const patientId = 'SC-PT-4092';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      updatePatientData('name', name);
      updatePatientData('age', age);
      updatePatientData('gender', gender);
      updatePatientData('bloodGroup', bloodGroup);
      updatePatientData('phone', phone);
      updatePatientData('city', city);
      updatePatientData('state', stateName);
      updatePatientData('hospital', hospital);
      updatePatientData('emergencyContact', emergencyContact);
      updatePatientData('emergencyPhone', emergencyPhone);
      updatePatientData('allergies', allergies);

      // Persist in localStorage for demo continuity
      if (typeof window !== 'undefined') {
        const profileObj = {
          name,
          age,
          gender,
          bloodGroup,
          phone,
          city,
          state: stateName,
          hospital,
          emergencyContact,
          emergencyPhone,
          allergies,
          isDonor,
          email,
        };
        window.localStorage.setItem('smartcare.patient_profile', JSON.stringify(profileObj));
      }

      setSaving(false);
      setSavedSuccess(true);
      showToast('Profile details updated successfully!', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaving(false);
      showToast('Failed to update profile. Please retry.', 'error');
    }
  };

  const handleFillDemo = () => {
    setName('Asha Rao');
    setAge('32');
    setGender('Female');
    setBloodGroup('O+');
    setPhone('+91 98490 28192');
    setCity('Hyderabad');
    setStateName('Telangana');
    setHospital('SmartCare Community Hospital');
    setEmergencyContact('Suresh Rao (Spouse)');
    setEmergencyPhone('+91 98490 33411');
    setAllergies('Mild seasonal penicillin sensitivity');
    setIsDonor(true);
    showToast('Demo profile data populated', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--mint)] border-2 border-[var(--teal-10)] flex items-center justify-center text-[var(--teal)] font-extrabold text-2xl shrink-0 shadow-xs">
              {name.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[var(--text)]">{name || 'Patient'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={12} /> Verified Member
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Patient ID: <span className="font-mono font-bold text-[var(--text)]">{patientId}</span> · {city}, {stateName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn-secondary btn-compact flex items-center gap-1.5 text-xs"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Fill demo data</span>
            </button>
            <Link
              href="/dashboard/patient/apply/1"
              className="btn-primary btn-compact flex items-center gap-1.5 text-xs no-underline"
            >
              <CalendarPlus size={14} />
              <span>Book visit</span>
            </Link>
          </div>
        </div>

        {/* Quick Identity Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--line)]">
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Blood Group</span>
            <span className="text-base font-extrabold text-red-600 flex items-center gap-1 mt-0.5">
              <Droplets size={14} /> {bloodGroup}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Total Visits</span>
            <span className="text-base font-extrabold text-[var(--text)] flex items-center gap-1 mt-0.5">
              <Clock size={14} className="text-[var(--teal)]" /> {patientVisits.length} Records
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Donor Status</span>
            <span className="text-base font-extrabold text-emerald-600 flex items-center gap-1 mt-0.5">
              <HeartPulse size={14} /> {isDonor ? 'Active Donor' : 'Not Enrolled'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Preferred Centre</span>
            <span className="text-xs font-bold text-[var(--text)] truncate block mt-1" title={hospital}>
              {hospital}
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Personal Particulars */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--line)]">
            <UserRound size={18} className="text-[var(--teal)]" />
            <h3 className="text-sm font-extrabold text-[var(--text)] uppercase tracking-wider">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="prof-name">Full Name <span>*</span></label>
              <input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Asha Rao"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label htmlFor="prof-age">Age <span>*</span></label>
                <input
                  id="prof-age"
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="32"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="prof-gender">Gender <span>*</span></label>
                <select
                  id="prof-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="prof-phone">Contact Phone <span>*</span></label>
              <div className="relative">
                <input
                  id="prof-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="prof-blood">Blood Group</label>
              <select
                id="prof-blood"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="prof-email">Email Address</label>
              <input
                id="prof-email"
                type="email"
                value={email || 'patient@smartcare.demo'}
                readOnly
                className="opacity-75 cursor-not-allowed bg-[var(--surface-sunken)]"
                title="Email is managed via your account authentication"
              />
              <span className="hint">Synced with active session credential</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label htmlFor="prof-city">City</label>
                <input
                  id="prof-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hyderabad"
                />
              </div>

              <div className="field">
                <label htmlFor="prof-state">State</label>
                <input
                  id="prof-state"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Telangana"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical & Emergency Contact */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--line)]">
            <HeartPulse size={18} className="text-red-500" />
            <h3 className="text-sm font-extrabold text-[var(--text)] uppercase tracking-wider">
              Emergency &amp; Medical Notes
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="prof-emergency-name">Emergency Contact Person <span>*</span></label>
              <input
                id="prof-emergency-name"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Suresh Rao (Spouse)"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="prof-emergency-phone">Emergency Phone <span>*</span></label>
              <input
                id="prof-emergency-phone"
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 98765 12345"
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="prof-allergies">Known Allergies / Pre-existing Conditions</label>
              <input
                id="prof-allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Peanuts, Asthma, or None"
              />
              <span className="hint">Shared confidentially with attending doctors during your consultations.</span>
            </div>

            <div className="field full">
              <label htmlFor="prof-hospital">Preferred Network Care Centre</label>
              <input
                id="prof-hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="SmartCare Community Hospital"
              />
            </div>

            {/* Blood donation opt-in */}
            <div className="field full pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] cursor-pointer hover:border-[var(--teal)] transition-colors">
                <input
                  type="checkbox"
                  checked={isDonor}
                  onChange={(e) => setIsDonor(e.target.checked)}
                  className="w-4 h-4 text-[var(--teal)] rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[var(--text)]">
                    Enrol in Emergency Blood &amp; Platelet Donor Registry
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Allow nearby hospitals to display your donor card when urgent matching blood units are requested.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <div className="flex items-center gap-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Changes saved to your profile
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">
                Make sure emergency contact info is always kept up to date.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 px-6 w-full sm:w-auto"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
