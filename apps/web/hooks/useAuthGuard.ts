'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useAppStore } from '@/lib/store/app-store';
import type { UserRole } from '@smartcare/types';

/**
 * Guards a page to require authentication.
 * In demo mode: automatically provides or initializes the demo role so all dashboards
 * are immediately accessible and fully populated with navigation, sidebar, and bottom bar.
 */
export function useAuthGuard(allowedRoles?: UserRole[]) {
  const { isLogged, role } = useSession();
  const login = useAppStore((s) => s.login);
  const allowedRolesRef = useRef(allowedRoles);
  allowedRolesRef.current = allowedRoles;

  const effectiveRole: UserRole = role || (allowedRoles?.[0] ?? 'patient');

  useEffect(() => {
    if (!isLogged && allowedRolesRef.current?.[0]) {
      const defaultRole = allowedRolesRef.current[0];
      const defaultEmail =
        defaultRole === 'patient'
          ? 'patient@smartcare.demo'
          : defaultRole === 'doctor'
          ? 'doctor@smartcare.demo'
          : 'staff@smartcare.demo';
      login(defaultEmail, defaultRole, {
        hospital: 'SmartCare Community Hospital',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
      });
    }
  }, [isLogged, login]);

  return { isLogged, role: effectiveRole };
}
