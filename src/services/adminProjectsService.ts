import api from "./api";
import type {
  PaginatedResponse,
  Project,
  ProjectCostItem,
  ProjectMilestone,
  ProjectCategoryPayload,
  ProjectModerationPayload,
} from "./projectsService";

export interface AdminProjectListParams {
  search?: string;
  category?: string;
  status?: Project["status"];
  is_verified?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface AdminProjectUser {
  id: string;
  email: string;
  full_name: string;
  user_type?: "investor" | "entrepreneur" | "admin";
  business_name?: string;
}

export interface AdminProjectCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AdminProjectImage {
  id: string;
  project: string;
  image: string;
  alt_text: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProjectDocument {
  id: string;
  project: string;
  file: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProject {
  id: string;
  entrepreneur: string;
  entrepreneur_detail: AdminProjectUser;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  category_detail: AdminProjectCategory;
  location: string;
  location_governorate: string;
  goal_amount: string;
  funded_amount: string;
  minimum_investment: string;
  expected_roi: string;
  cost_items: ProjectCostItem[];
  faqs: import("./projectsService").ProjectFaq[];
  milestones: ProjectMilestone[];
  funding_period_days: number;
  start_date: string;
  end_date: string | null;
  status: "draft" | "active" | "closed" | "successful" | "failed" | "paused";
  is_verified: boolean;
  verified_by: string | null;
  verified_by_detail: AdminProjectUser | null;
  verified_at: string | null;
  verification_notes: string;
  business_plan: string | null;
  financial_projections: string | null;
  ownership_proof: string | null;
  cover_image: string | null;
  images: AdminProjectImage[];
  video_url: string;
  ai_classified_category: string;
  ai_confidence_score: string | null;
  ai_classification_at: string | null;
  ai_generated_summary: string;
  milestone_count: number;
  repayment_status: "on_track" | "delayed" | "completed";
  total_repaid: string;
  next_repayment_date: string | null;
  view_count: number;
  investor_count: number;
  rating: string;
  reviews_count: number;
  supporting_documents: AdminProjectDocument[];
  days_left: number | null;
  funding_percent: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProjectPayload {
  entrepreneur: string;
  title: string;
  slug?: string;
  description: string;
  short_description: string;
  category: string;
  location: string;
  location_governorate?: string;
  goal_amount: string;
  funded_amount?: string;
  minimum_investment?: string;
  expected_roi?: string;
  cost_items: ProjectCostItem[];
  faqs?: import("./projectsService").ProjectFaq[];
  milestones: ProjectMilestone[];
  funding_period_days?: number;
  start_date?: string;
  end_date?: string | null;
  status?: AdminProject["status"];
  is_verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string;
  business_plan?: File;
  financial_projections?: File;
  ownership_proof?: File;
  cover_image?: File;
  clear_business_plan?: boolean;
  clear_financial_projections?: boolean;
  clear_ownership_proof?: boolean;
  clear_cover_image?: boolean;
  video_url?: string;
  ai_classified_category?: string;
  ai_confidence_score?: string | null;
  ai_classification_at?: string | null;
  ai_generated_summary?: string;
  milestone_count?: number;
  repayment_status?: AdminProject["repayment_status"];
  total_repaid?: string;
  next_repayment_date?: string | null;
  view_count?: number;
  investor_count?: number;
  rating?: string;
  reviews_count?: number;
  deleted_at?: string | null;
}

const asPage = <T>(response: unknown): PaginatedResponse<T> => {
  if (Array.isArray(response)) {
    return { count: response.length, next: null, previous: null, results: response as T[] };
  }
  return response as PaginatedResponse<T>;
};

const listAll = async <T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T[]> => {
  const firstPage = asPage<T>(
    await api.get(path, { params: { ...params, page_size: 100 } }),
  );
  const results = [...firstPage.results];
  const visited = new Set<string>();
  let next = firstPage.next;

  while (next && !visited.has(next)) {
    visited.add(next);
    const page = asPage<T>(await api.get(next));
    results.push(...page.results);
    next = page.next;
  }

  return results;
};

const containsFile = (payload: Partial<AdminProjectPayload>) =>
  Object.values(payload).some((value) => value instanceof File);

const toFormData = (payload: Partial<AdminProjectPayload>) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
};

const writeConfig = (payload: Partial<AdminProjectPayload>) =>
  containsFile(payload) ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;

const writeBody = (payload: Partial<AdminProjectPayload>) =>
  containsFile(payload) ? toFormData(payload) : payload;

const toProjectSummary = (project: AdminProject): Project => ({
  ...project,
  entrepreneur: project.entrepreneur_detail,
});

const adminProjectsService = {
  listProjects: async (
    params: AdminProjectListParams = {},
  ): Promise<PaginatedResponse<Project>> => {
    const response = asPage<AdminProject>(
      await api.get("admin/projects/", { params }),
    );
    return {
      ...response,
      results: response.results.map(toProjectSummary),
    };
  },

  getProject: async (id: string): Promise<AdminProject> =>
    await api.get("admin/projects/" + id + "/"),

  createProject: async (payload: AdminProjectPayload): Promise<AdminProject> =>
    await api.post("admin/projects/", writeBody(payload), writeConfig(payload)),

  updateProject: async (
    id: string,
    payload: Partial<AdminProjectPayload>,
  ): Promise<AdminProject> =>
    await api.patch("admin/projects/" + id + "/", writeBody(payload), writeConfig(payload)),

  deleteProject: async (id: string): Promise<void> => {
    await api.delete("admin/projects/" + id + "/");
  },

  verifyProject: async (id: string, verificationNotes = ""): Promise<AdminProject> =>
    await api.post("admin/projects/" + id + "/verify/", {
      verification_notes: verificationNotes,
    }),

  rejectProject: async (id: string, verificationNotes: string): Promise<AdminProject> =>
    await api.post("admin/projects/" + id + "/reject/", {
      verification_notes: verificationNotes,
    }),

  approveProjectEdit: async (id: string, verificationNotes = ""): Promise<AdminProject> =>
    await api.post("admin/projects/" + id + "/approve-edit/", {
      verification_notes: verificationNotes,
    }),

  rejectProjectEdit: async (id: string, verificationNotes: string): Promise<AdminProject> =>
    await api.post("admin/projects/" + id + "/reject-edit/", {
      verification_notes: verificationNotes,
    }),

  setProjectStatus: async (
    id: string,
    payload: ProjectModerationPayload,
  ): Promise<AdminProject> =>
    await api.post("admin/projects/" + id + "/set-status/", payload),

  listOwners: async (): Promise<AdminProjectUser[]> => {
    return await listAll<AdminProjectUser>("admin/users/", { ordering: "email" });
  },

  listCategories: async (): Promise<AdminProjectCategory[]> => {
    return await listAll<AdminProjectCategory>("admin/categories/", {
      ordering: "name",
    });
  },

  createCategory: async (
    payload: ProjectCategoryPayload,
  ): Promise<AdminProjectCategory> =>
    await api.post("admin/categories/", payload),

  updateCategory: async (
    id: string,
    payload: ProjectCategoryPayload,
  ): Promise<AdminProjectCategory> =>
    await api.patch("admin/categories/" + id + "/", payload),

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete("admin/categories/" + id + "/");
  },

  createImage: async (project: string, image: File, altText: string): Promise<AdminProjectImage> => {
    const body = new FormData();
    body.append("project", project);
    body.append("image", image);
    body.append("alt_text", altText);
    return await api.post("admin/project-images/", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateImage: async (id: string, altText: string): Promise<AdminProjectImage> =>
    await api.patch("admin/project-images/" + id + "/", { alt_text: altText }),

  deleteImage: async (id: string): Promise<void> => {
    await api.delete("admin/project-images/" + id + "/");
  },

  createDocument: async (
    project: string,
    file: File,
    title: string,
  ): Promise<AdminProjectDocument> => {
    const body = new FormData();
    body.append("project", project);
    body.append("file", file);
    body.append("title", title);
    return await api.post("admin/project-documents/", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateDocument: async (id: string, title: string): Promise<AdminProjectDocument> =>
    await api.patch("admin/project-documents/" + id + "/", { title }),

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete("admin/project-documents/" + id + "/");
  },
};

export default adminProjectsService;
