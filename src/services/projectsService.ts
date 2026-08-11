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
  minimum_investment: string;
  expected_roi: string;
  cost_items: ProjectCostItem[];
  milestones: ProjectMilestone[];
  funding_period_days: number;
  start_date?: string;
  end_date?: string | null;
  status: "draft" | "active" | "closed" | "successful" | "failed" | "paused";
  is_verified: boolean;
  cover_image?: string | null;
  video_url?: string;
  investor_count: number;
  days_left: number | null;
  funding_percent: number;
  view_count?: number;
  rating?: string;
  reviews_count?: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
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

export interface ProjectModerationPayload {
  status: Extract<Project["status"], "active" | "paused" | "closed" | "successful">;
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
  milestones: ProjectMilestone[];
  funding_period_days: string;
  video_url?: string;
  cover_image?: File | null;
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
};

export default projectsService;
