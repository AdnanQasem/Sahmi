import api from "./api";
import type { Page } from "./messagingService";

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  target_type: string;
  target_id: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  message_notifications: boolean;
  project_notifications: boolean;
  investment_notifications: boolean;
  milestone_notifications: boolean;
  repayment_notifications: boolean;
}

const notificationService = {
  list: (): Promise<Page<Notification>> => api.get("notifications/"),
  unreadCount: (): Promise<{ unread_count: number }> => api.get("notifications/unread-count/"),
  markRead: (id: string): Promise<{ read: boolean }> => api.post(`notifications/${id}/mark-read/`),
  markAllRead: (): Promise<{ marked_all_read: boolean }> => api.post("notifications/mark-all-read/"),
  getPreferences: (): Promise<NotificationPreferences> => api.get("notifications/preferences/"),
  savePreferences: (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> =>
    api.patch("notifications/preferences/", preferences),
};

export default notificationService;