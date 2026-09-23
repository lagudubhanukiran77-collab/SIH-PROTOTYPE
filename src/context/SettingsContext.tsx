import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RestaurantSettings } from '../types';
import { localDB } from '../lib/supabase';
import { isRestaurantOpen } from '../lib/businessRules';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: RestaurantSettings;
  isOpen: boolean;
  statusReason?: string;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<RestaurantSettings>(() => localDB.getSettings());
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean; reason?: string }>({
    isOpen: true,
  });

  const refreshSettings = useCallback(() => {
    const s = localDB.getSettings();
    setSettings(s);
    setOpenStatus(isRestaurantOpen(s, new Date()));
  }, []);

  useEffect(() => {
    refreshSettings();
    const interval = setInterval(refreshSettings, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [refreshSettings]);

  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    if (!isAdmin) {
      alert('Access Denied: Only administrators can modify restaurant settings (Rule 3, 29).');
      return;
    }
    const updated = localDB.updateSettings(newSettings, user?.id);
    setSettings(updated);
    setOpenStatus(isRestaurantOpen(updated, new Date()));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isOpen: openStatus.isOpen,
        statusReason: openStatus.reason,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
