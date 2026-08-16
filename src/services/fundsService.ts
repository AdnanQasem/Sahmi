import api from "./api";
import type { PaginatedResponse, ProjectMilestone } from "./projectsService";

export type WithdrawalStatus = "requested" | "under_review" | "approved" | "released" | "rejected" | "revision_required" | "cancelled";

export interface WithdrawalRequest {
  id: string;
  project: string;
  project_title: string;
  project_status: "fully_funded" | "implementation" | "completed" | "failed" | "cancelled";
  milestone: string;
  milestone_title: string;
  requested_by: string;
  amount: string;
  evidence_description: string;
  planned_expenses: string;
  evidence_file: string | null;
  status: WithdrawalStatus;
  review_notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  released_by: string | null;
  released_at: string | null;
  payout_reference: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalPayload {
  milestone: string;
  amount: string;
  evidence_description: string;
  planned_expenses: string;
  evidence_file?: File | null;
}

export interface MilestoneCompletionPayload {
  summary: string;
  evidence: File;
}

const fundsService = {
  list: (params: { project?: string; status?: string; page_size?: number } = {}): Promise<PaginatedResponse<WithdrawalRequest>> =>
    api.get("withdrawals/", { params: { page_size: 100, ...params } }),
  create: (payload: WithdrawalPayload): Promise<WithdrawalRequest> => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => { if (value !== undefined && value !== null) body.append(key, value); });
    return api.post("withdrawals/", body, { headers: { "Content-Type": "multipart/form-data" } });
  },
  review: (id: string): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/review/`, {}),
  approve: (id: string, review_notes = ""): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/approve/`, { review_notes }),
  reject: (id: string, review_notes: string): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/reject/`, { review_notes }),
  requestRevision: (id: string, review_notes: string): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/request-revision/`, { review_notes }),
  release: (id: string): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/release/`, {}),
  cancel: (id: string): Promise<WithdrawalRequest> => api.post(`withdrawals/${id}/cancel/`, {}),
  submitMilestoneCompletion: (id: string, payload: MilestoneCompletionPayload): Promise<ProjectMilestone> => {
    const body = new FormData();
    body.append("completion_summary", payload.summary);
    body.append("completion_evidence", payload.evidence);
    return api.post(`milestones/${id}/submit-completion/`, body, { headers: { "Content-Type": "multipart/form-data" } });
  },
  reviewMilestoneCompletion: (id: string): Promise<ProjectMilestone> => api.post(`milestones/${id}/review-completion/`, {}),
  approveMilestoneCompletion: (id: string, review_notes = ""): Promise<ProjectMilestone> => api.post(`milestones/${id}/approve-completion/`, { review_notes }),
  requestMilestoneCompletionRevision: (id: string, review_notes: string): Promise<ProjectMilestone> => api.post(`milestones/${id}/request-completion-revision/`, { review_notes }),
  rejectMilestoneCompletion: (id: string, review_notes: string): Promise<ProjectMilestone> => api.post(`milestones/${id}/reject-completion/`, { review_notes }),
};

export default fundsService;
