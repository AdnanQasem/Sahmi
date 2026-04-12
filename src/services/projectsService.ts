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
  username: string;
  email: string;
  full_name: string;
  user_type: "investor" | "entrepreneur" | "admin";
  business_name?: string;
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
  created_at: string;
  updated_at?: string;
}

export interface ProjectListParams {
  search?: string;
  category?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
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
    formData.append(key, value);
  });
  return formData;
};

const projectsService = {
  listCategories: async (): Promise<ProjectCategory[]> => {
    const response = await api.get("categories/", { params: { page_size: 100, ordering: "name" } });
    return Array.isArray(response) ? response : (response as PaginatedResponse<ProjectCategory>).results;
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
};

export default projectsService;
