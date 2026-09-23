import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { localDB } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isCustomer: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  switchRole: (role: UserRole) => void;
  updateProfile: (data: Partial<Profile>) => void;
}

const PRESET_USERS: Record<UserRole, Profile> = {
  customer: {
    id: 'user-customer-1',
    full_name: 'Aarav Patel',
    phone: '+91 98765 00001',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'customer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  staff: {
    id: 'user-staff-1',
    full_name: 'Chef Marco Rossi (Operations)',
    phone: '+91 98765 00002',
    avatar_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    role: 'staff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'user-admin-1',
    full_name: 'Elena Vance (General Manager)',
    phone: '+91 98765 00003',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('mf_active_role') as UserRole;
    return saved && ['customer', 'staff', 'admin'].includes(saved) ? saved : 'customer';
  });

  const [user, setUser] = useState<Profile>(PRESET_USERS[currentRole]);

  useEffect(() => {
    localStorage.setItem('mf_active_role', currentRole);
    setUser(PRESET_USERS[currentRole]);
  }, [currentRole]);

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    localDB.logAudit({
      user_id: PRESET_USERS[newRole].id,
      action: 'ROLE_SWITCHED_DEMO',
      resource: 'auth',
      new_data: { role: newRole, user_name: PRESET_USERS[newRole].full_name },
    });
  };

  const updateProfile = (data: Partial<Profile>) => {
    // Rule 2: Customer cannot change their own role!
    if (data.role && data.role !== currentRole && currentRole === 'customer') {
      alert('Security Policy: Customers cannot elevate their own role.');
      return;
    }
    setUser((prev) => ({ ...prev, ...data, updated_at: new Date().toISOString() }));
  };

  const isCustomer = user.role === 'customer';
  const isStaff = user.role === 'staff' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        isCustomer,
        isStaff,
        isAdmin,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
