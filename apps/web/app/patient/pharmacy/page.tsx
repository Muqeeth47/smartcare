import { redirect } from 'next/navigation';

export default function PatientPharmacyRedirect() {
  redirect('/dashboard/patient/pharmacy');
}
