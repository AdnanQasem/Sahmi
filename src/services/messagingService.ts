import api from "./api";

export interface ParticipantUser {
  id: string;
  full_name: string;
  user_type: string;
}

export interface ConversationParticipant {
  id: string;
  user: ParticipantUser;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation: string;
  sender: ParticipantUser;
  sender_id: string;
  body: string;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
}

export interface Conversation {
  id: string;
  kind: "direct" | "project" | "group";
  title: string;
  project: string | null;
  created_by: ParticipantUser;
  participants: ConversationParticipant[];
  last_message_preview: { id: string; sender_id: string; preview: string; created_at: string } | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface Page<T> {
  count: number;
  results: T[];
}

const messagingService = {
  listConversations: (): Promise<Page<Conversation>> => api.get("conversations/"),
  searchUsers: (query: string): Promise<ParticipantUser[]> =>
    api.get("conversations/user-search/", { params: { q: query } }),
  createDirectConversation: (otherUserId: string): Promise<Conversation> =>
    api.post("conversations/", { kind: "direct", other_user_id: otherUserId }),
  listMessages: (conversationId: string): Promise<Page<Message>> =>
    api.get(`conversations/${conversationId}/messages/`),
  sendMessage: (conversationId: string, body: string): Promise<Message> =>
    api.post(`conversations/${conversationId}/messages/`, { body }),
  markRead: (conversationId: string): Promise<{ marked_read: boolean }> =>
    api.post(`conversations/${conversationId}/mark-read/`),
  unreadCount: (): Promise<{ unread_count: number }> => api.get("conversations/unread-count/"),
};

export default messagingService;