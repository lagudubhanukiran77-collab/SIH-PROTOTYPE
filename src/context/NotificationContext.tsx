import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import { localDB } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const list = localDB.getNotifications(user.id);
    setNotifications(list);
  }, [user]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAllAsRead = () => {
    if (!user) return;
    localDB.markNotificationsRead(user.id);
    refreshNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
