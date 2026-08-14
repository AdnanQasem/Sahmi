import api, { API_BASE_URL } from "./api";
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
  delivery_status?: string;
  target_url: string;
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
  list: (params: { page?: number; read?: boolean; type?: string } = {}): Promise<Page<Notification> & { next?: string | null; previous?: string | null }> => api.get("notifications/", { params }),
  unreadCount: (): Promise<{ unread_count: number }> => api.get("notifications/unread-count/"),
  markRead: (id: string): Promise<{ read: boolean }> => api.post(`notifications/${id}/mark-read/`),
  markAllRead: (): Promise<{ marked_all_read: boolean }> => api.post("notifications/mark-all-read/"),
  getPreferences: (): Promise<NotificationPreferences> => api.get("notifications/preferences/"),
  savePreferences: (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> =>
    api.patch("notifications/preferences/", preferences),
  subscribe: (onNotification: () => void): (() => void) => {
    const controller = new AbortController();
    const token = localStorage.getItem("accessToken");
    void fetch(`${API_BASE_URL.replace(/\/?$/, "/")}notifications/stream/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok || !response.body) throw new Error("Notification stream unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach((event) => {
          const line = event.split("\n").find((part) => part.startsWith("data:"));
          if (!line) return;
          try {
            const payload = JSON.parse(line.slice(5).trim()) as { type?: string };
            if (payload.type === "notification") onNotification();
          } catch { /* Ignore malformed keepalive events. */ }
        });
      }
    }).catch(() => { /* React Query polling remains the fallback. */ });
    return () => controller.abort();
  },
};

export default notificationService;
