import api from "./api";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface UserSummary {
  id: string;
  username?: string;
  email: string;
  full_name: string;
  user_type?: "investor" | "entrepreneur" | "admin";
  business_name?: string;
}

export interface ConfirmedPayment {
  id: string;
  investor_name: string;
  amount: number;
  date: string;
  payment_method: string;
}

export interface ProjectCostItem {
  name: string;
  description: string;
  quantity: string;
  unit_cost: string;
}

export interface ProjectFaq {
  question: string;
  answer: string;
}

export interface ProjectFieldChange {
  before: unknown;
  after: unknown;
}

export interface ProjectUpdate {
  id: string;
  published_at: string;
  changes: Record<string, ProjectFieldChange>;
}

export interface ProjectRepayment {
  id: string;
  amount: number;
  scheduled_date: string;
  actual_payment_date: string | null;
  status: "pending" | "due" | "paid" | "overdue" | "cancelled";
  payment_method: string;
}

export interface ProjectMilestone {
  id?: string;
  title: string;
  description: string;
  target_date: string;
  actual_completion_date?: string | null;
  status?: "pending" | "in_progress" | "completed" | "delayed";
  deliverables: string;
  percentage_of_project: string;
  funding_released?: string;
  order: number;
  completion_status?: "not_submitted" | "submitted" | "under_review" | "revision_required" | "rejected" | "approved";
  completion_summary?: string;
  completion_evidence?: string | null;
  completion_submitted_at?: string | null;
  completion_review_notes?: string;
  completion_reviewed_at?: string | null;
}

export type EditImageReviewStatus = "approved" | "needs_revision" | "rejected";

export interface EditImageReview {
  key: string;
  kind: "proposed_cover" | "current_cover" | "gallery";
  url: string;
  file_name: string;
  upload_date: string;
  size: number | null;
  review_notes: string;
  status: EditImageReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface ProjectFundingAccount {
  secured: string;
  released: string;
  refunded: string;
  available: string;
}

export interface ProjectImage {
  id: string;
  image: string;
  alt_text: string;
}

export interface Project {
  id: string;
  entrepreneur?: UserSummary;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  category_detail?: ProjectCategory;
  location: string;
  location_governorate?: string;
  goal_amount: string;
  funded_amount: string;
  funding_account: ProjectFundingAccount;
  funding_reached_at?: string | null;
  pending_payment_deadline?: string | null;
  funding_finalized_at?: string | null;
  quality_hold_started_at?: string | null;
  quality_hold_until?: string | null;
  completion_handover_approved_at?: string | null;
  completion_handover_approved_by?: string | null;
  completion_handover_notes?: string;
  minimum_investment: string;
  expected_roi: string;
  cost_items: ProjectCostItem[];
  faqs?: ProjectFaq[];
  milestones: ProjectMilestone[];
  funding_period_days: number;
  start_date?: string;
  end_date?: string | null;
  status: "draft" | "fundraising" | "fully_funded" | "implementation" | "completed" | "failed" | "paused" | "cancelled";
  is_verified: boolean;
  business_plan?: string | null;
  financial_projections?: string | null;
  ownership_proof?: string | null;
  cover_image?: string | null;
  images?: ProjectImage[];
  video_url?: string;
  investor_count: number;
  days_left: number | null;
  funding_percent: number;
  repayment_status?: "on_track" | "delayed" | "completed";
  total_repaid?: string;
  next_repayment_date?: string | null;
  view_count?: number;
  rating?: string;
  reviews_count?: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  implementation_complete?: boolean;
  updates?: ProjectUpdate[];
  pending_edit_request?: {
    id: string;
    payload: Partial<Project>;
    changes: Record<string, ProjectFieldChange>;
    files: Partial<Record<"cover_image" | "business_plan" | "financial_projections" | "ownership_proof", string>>;
    images: EditImageReview[];
    submitted_by: string;
    created_at: string;
  } | null;
}

export interface ProjectListParams {
  search?: string;
  category?: string;
  status?: Project["status"];
  is_verified?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectContentTranslation {
  language: "en" | "ar";
  description: string;
  cost_items: ProjectCostItem[];
  faqs: ProjectFaq[];
  milestones: Array<Pick<ProjectMilestone, "id" | "title" | "description" | "deliverables">>;
}

export type ProjectEditContentTranslation = Partial<ProjectContentTranslation> & Pick<ProjectContentTranslation, "language">;

export interface ProjectModerationPayload {
  status: Extract<Project["status"], "fundraising" | "paused" | "failed" | "cancelled">;
  verification_notes?: string;
}

export interface ProjectCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
}

export interface ProjectCreatePayload {
  title: string;
  category: string;
  short_description: string;
  description: string;
  location: string;
  location_governorate?: string;
  goal_amount: string;
  minimum_investment?: string;
  expected_roi?: string;
  cost_items: ProjectCostItem[];
  faqs: ProjectFaq[];
  milestones: ProjectMilestone[];
  funding_period_days: string;
  video_url?: string;
  cover_image?: File | null;
  business_plan?: File | null;
  financial_projections?: File | null;
  ownership_proof?: File | null;
}

const toFormData = (payload: ProjectCreatePayload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  });
  return formData;
};

const projectsService = {
  listCategories: async (): Promise<ProjectCategory[]> => {
    const response = (await api.get("categories/", {
      params: { page_size: 100, ordering: "name" },
    })) as unknown as ProjectCategory[] | PaginatedResponse<ProjectCategory>;
    return Array.isArray(response) ? response : response.results;
  },

  createCategory: async (payload: ProjectCategoryPayload): Promise<ProjectCategory> => {
    return await api.post("categories/", payload);
  },

  updateCategory: async (id: string, payload: ProjectCategoryPayload): Promise<ProjectCategory> => {
    return await api.patch(`categories/${id}/`, payload);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`categories/${id}/`);
  },

  listProjects: async (params: ProjectListParams = {}): Promise<PaginatedResponse<Project>> => {
    return await api.get("projects/", { params });
  },

  listMyProjects: async (): Promise<PaginatedResponse<Project>> => {
    return await api.get("projects/my/", { params: { page_size: 100, ordering: "-created_at" } });
  },

  getProject: async (slug: string): Promise<Project> => {
    return await api.get(`projects/${slug}/`);
  },

  getProjectTranslation: async (
    slug: string,
    language: "en" | "ar",
    editRequestId?: string,
  ): Promise<ProjectContentTranslation | ProjectEditContentTranslation> => {
    return await api.get(`projects/${slug}/translation/`, {
      params: { language, ...(editRequestId ? { edit_request: editRequestId } : {}) },
    });
  },

  createProject: async (payload: ProjectCreatePayload): Promise<Project> => {
    return await api.post("projects/", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateProject: async (slug: string, payload: Partial<ProjectCreatePayload>): Promise<Project> => {
    return await api.patch(`projects/${slug}/`, toFormData(payload as ProjectCreatePayload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteProject: async (slug: string): Promise<void> => {
    await api.delete(`projects/${slug}/`);
  },

  verifyProject: async (slug: string, verificationNotes = ""): Promise<Project> => {
    return await api.post(`projects/${slug}/verify/`, {
      verification_notes: verificationNotes,
    });
  },

  rejectProject: async (slug: string, verificationNotes: string): Promise<Project> => {
    return await api.post(`projects/${slug}/reject/`, {
      verification_notes: verificationNotes,
    });
  },

  setProjectStatus: async (slug: string, payload: ProjectModerationPayload): Promise<Project> => {
    return await api.post(`projects/${slug}/set-status/`, payload);
  },

  getProjectPayments: async (slug: string): Promise<ConfirmedPayment[]> => {
    return await api.get(`projects/${slug}/payments/`);
  },

  getProjectRepayments: async (slug: string): Promise<ProjectRepayment[]> => {
    return await api.get(`projects/${slug}/repayments/`);
  },
};

export default projectsService;
