import api from "./api";
import type { PaginatedResponse } from "./projectsService";

export interface AdminListParams {
  search?: string;
  status?: string;
  payment_method?: string;
  project?: string;
  investor?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface AdminUserOption {
  id: string;
  email: string;
  full_name: string;
  user_type?: string;
}

export interface AdminProjectOption {
  id: string;
  title: string;
  slug: string;
  status?: string;
  is_verified?: boolean;
}

export interface AdminInvestment {
  id: string;
  investor: string;
  investor_detail?: AdminUserOption;
  investor_name?: string;
  project: string;
  project_detail?: AdminProjectOption;
  amount: string;
  quantity: number;
  investment_date: string;
  status: "pending" | "confirmed" | "canceled" | "completed";
  transaction_id: string;
  payment_method: "card" | "bank_transfer" | "paypal";
  expected_return: string;
  actual_return: string;
  return_received_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminInvestmentPayload {
  investor: string;
  project: string;
  amount: string;
  quantity: number;
  status: AdminInvestment["status"];
  transaction_id?: string;
  payment_method: AdminInvestment["payment_method"];
  expected_return?: string;
  actual_return?: string;
  return_received_at?: string | null;
  notes?: string;
}

export interface AdminMilestone {
  id: string;
  project: string;
  project_detail?: AdminProjectOption;
  project_title?: string;
  title: string;
  description: string;
  target_date: string;
  actual_completion_date: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  deliverables: string;
  percentage_of_project: string;
  funding_released: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMilestonePayload {
  project: string;
  title: string;
  description: string;
  target_date: string;
  actual_completion_date?: string | null;
  status: AdminMilestone["status"];
  deliverables?: string;
  percentage_of_project: string;
  funding_released?: string;
  order: number;
}

export interface AdminRepayment {
  id: string;
  investment: string;
  investor_detail?: AdminUserOption;
  project_detail?: AdminProjectOption;
  amount: string;
  scheduled_date: string;
  actual_payment_date: string | null;
  status: "pending" | "paid" | "overdue" | "canceled";
  payment_method: AdminInvestment["payment_method"];
  transaction_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRepaymentPayload {
  investment: string;
  amount: string;
  scheduled_date: string;
  actual_payment_date?: string | null;
  status: AdminRepayment["status"];
  payment_method: AdminRepayment["payment_method"];
  transaction_id?: string;
  notes?: string;
}

const asPage = <T>(response: unknown): PaginatedResponse<T> => {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      next: null,
      previous: null,
      results: response as T[],
    };
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

const adminFinanceService = {
  listInvestments: async (params: AdminListParams = {}): Promise<PaginatedResponse<AdminInvestment>> =>
    asPage<AdminInvestment>(await api.get("admin/investments/", { params })),

  createInvestment: async (payload: AdminInvestmentPayload): Promise<AdminInvestment> =>
    await api.post("admin/investments/", payload),

  updateInvestment: async (id: string, payload: Partial<AdminInvestmentPayload>): Promise<AdminInvestment> =>
    await api.patch("admin/investments/" + id + "/", payload),

  deleteInvestment: async (id: string): Promise<void> => {
    await api.delete("admin/investments/" + id + "/");
  },

  listMilestones: async (params: AdminListParams = {}): Promise<PaginatedResponse<AdminMilestone>> =>
    asPage<AdminMilestone>(await api.get("admin/milestones/", { params })),

  createMilestone: async (payload: AdminMilestonePayload): Promise<AdminMilestone> =>
    await api.post("admin/milestones/", payload),

  updateMilestone: async (id: string, payload: Partial<AdminMilestonePayload>): Promise<AdminMilestone> =>
    await api.patch("admin/milestones/" + id + "/", payload),

  deleteMilestone: async (id: string): Promise<void> => {
    await api.delete("admin/milestones/" + id + "/");
  },

  listRepayments: async (params: AdminListParams = {}): Promise<PaginatedResponse<AdminRepayment>> =>
    asPage<AdminRepayment>(await api.get("admin/repayments/", { params })),

  createRepayment: async (payload: AdminRepaymentPayload): Promise<AdminRepayment> =>
    await api.post("admin/repayments/", payload),

  updateRepayment: async (id: string, payload: Partial<AdminRepaymentPayload>): Promise<AdminRepayment> =>
    await api.patch("admin/repayments/" + id + "/", payload),

  deleteRepayment: async (id: string): Promise<void> => {
    await api.delete("admin/repayments/" + id + "/");
  },

  listUserOptions: async (): Promise<AdminUserOption[]> => {
    return await listAll<AdminUserOption>("admin/users/", { ordering: "email" });
  },

  listProjectOptions: async (): Promise<AdminProjectOption[]> => {
    return await listAll<AdminProjectOption>("admin/projects/", { ordering: "title" });
  },

  listInvestmentOptions: async (): Promise<AdminInvestment[]> =>
    await listAll<AdminInvestment>("admin/investments/", {
      ordering: "-investment_date",
    }),
};

export default adminFinanceService;
