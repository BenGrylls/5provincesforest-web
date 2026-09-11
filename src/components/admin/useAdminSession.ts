'use client';

import { useEffect, useState } from 'react';

export type AdminSession = {
  role: 'super_admin' | 'sub_admin';
  username: string;
  permissions: string[];
};

type State = {
  session: AdminSession | null;
  /** true จนกว่าจะรู้สิทธิ์จริง — ระหว่างนี้ห้ามเดาว่าเป็น super admin */
  loading: boolean;
};

/**
 * เดิมแต่ละหน้า fetch /api/auth/session เองแล้วตั้งค่าเริ่มต้นเป็น super_admin
 * ทำให้ sub-admin เห็นเมนูของ super admin แวบหนึ่งก่อนข้อมูลจริงจะมาถึง
 */
export function useAdminSession(): State & { isSuperAdmin: boolean; permissions: string[]; canManage: (permission: string) => boolean } {
  const [state, setState] = useState<State>({ session: null, loading: true });

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session')
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((data) => {
        if (!active) return;
        const session: AdminSession | null = data
          ? {
              role: data.role === 'sub_admin' ? 'sub_admin' : 'super_admin',
              username: typeof data.username === 'string' ? data.username : '',
              permissions: Array.isArray(data.permissions) ? data.permissions : [],
            }
          : null;
        setState({ session, loading: false });
      });
    return () => { active = false; };
  }, []);

  const isSuperAdmin = state.session?.role === 'super_admin';
  const permissions = state.session?.permissions ?? [];

  return {
    ...state,
    isSuperAdmin,
    permissions,
    canManage: (permission: string) => isSuperAdmin || permissions.includes(permission),
  };
}
