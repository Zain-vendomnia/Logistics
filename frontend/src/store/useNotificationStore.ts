import { ReactNode } from "react";
import { create } from "zustand";

export enum NotificationSeverity {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export interface NotificationProp {
  id: string;
  title?: string;
  message: string;
  severity?: NotificationSeverity;

  icon?: ReactNode;
  actions?: ReactNode;

  duration?: number;

  onComplete?: () => void;
}

interface NotificationStore {
  notifications: NotificationProp[];
  showNotification: (notification: Omit<NotificationProp, "id">) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  showNotification: (notification) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    const duration = notification.duration ?? 6000;
    const timeout = setTimeout(
      () =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      duration
    );

    return () => timeout && clearTimeout(timeout);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
