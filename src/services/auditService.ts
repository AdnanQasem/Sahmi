import api from "./api";

export interface AuditActor {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string | null;
  actor_detail: AuditActor | null;
  action: string;
  target_type: string;
  target_id: string;
  result: "success" | "failure" | "denied";
  metadata: Record<string, unknown>;
  request_id: string;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface AuditLogPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogRecord[];
}

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  search?: string;
  result?: string;
  target_type?: string;
  ordering?: string;
}

const auditService = {
  list: async (params: AuditLogParams = {}): Promise<AuditLogPage> =>
    await api.get("audit-logs/", { params }),
  retrieve: async (id: string): Promise<AuditLogRecord> =>
    await api.get(`audit-logs/${id}/`),
};

export default auditService;
