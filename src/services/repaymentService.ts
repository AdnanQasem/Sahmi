import api from "./api";
import type { PaginatedResponse } from "./projectsService";

export type RepaymentStatus = "pending" | "due" | "paid" | "overdue" | "cancelled";
export type RepaymentTransferStatus = "submitted" | "under_review" | "verified" | "rejected" | "disbursed";
export type RepaymentPlanStatus = "submitted" | "under_review" | "revision_required" | "approved" | "rejected";

export interface RepaymentPlanInstallment {
  id?: string;
  amount: string;
  recipient?: "investor" | "platform";
  scheduled_date: string;
  payment_method: "card" | "bank_transfer" | "paypal";
  notes?: string;
  status?: RepaymentStatus;
}

export interface RepaymentPlan {
  id: string;
  investment: string;
  investor_id: string;
  investor_name: string;
  project_id: string;
  project_title: string;
  principal: string;
  expected_return: string;
  obligation_total: string;
  platform_fee: string;
  total_with_platform_fee: string;
  status: RepaymentPlanStatus;
  notes: string;
  review_notes: string;
  submitted_at: string;
  reviewed_by_name?: string;
  reviewed_at: string | null;
  installments: RepaymentPlanInstallment[];
}

export interface EligibleRepaymentInvestment {
  id: string;
  investor_id: string;
  investor_name: string;
  project_id: string;
  project_title: string;
  principal: string;
  expected_return: string;
  obligation_total: string;
  platform_fee: string;
  total_with_platform_fee: string;
  earliest_repayment_date: string;
}

export interface RepaymentTransferSummary {
  id: string;
  status: RepaymentTransferStatus;
  inbound_reference: string;
  outbound_reference: string;
  review_notes?: string;
  reviewed_at?: string | null;
}

export interface RepaymentTransfer extends RepaymentTransferSummary {
  repayment: string;
  submitted_by: string;
  submitted_by_name: string;
  amount: string;
  currency: string;
  inbound_transfer_date: string;
  receipt_url: string | null;
  source_of_funds_declaration?: string;
  agreement_version: string;
  agreement_accepted_at: string;
  reviewed_at: string | null;
  review_notes?: string;
  disbursed_at: string | null;
  created_at: string;
}

export interface RepaymentRecord {
  id: string;
  investment: string;
  investor_name: string;
  project_id: string;
  project_title: string;
  amount: string;
  recipient: "investor" | "platform";
  scheduled_date: string;
  actual_payment_date: string | null;
  status: RepaymentStatus;
  payment_method: "card" | "bank_transfer" | "paypal";
  transaction_id: string;
  notes: string;
  funding_transfer: RepaymentTransferSummary | null;
}

export interface RepaymentSummary {
  obligation_total: string;
  platform_fee_rate?: string;
  platform_fee_total?: string;
  platform_fee_scheduled?: string;
  platform_fee_paid?: string;
  platform_fee_remaining?: string;
  scheduled_total: string;
  paid_total: string;
  remaining_total: string;
  unscheduled_total: string;
  obligations: RepaymentObligation[];
  next_repayment_date: string | null;
  counts: Record<RepaymentStatus, number>;
}

export interface RepaymentObligation {
  project_id: string;
  project_slug: string;
  project_title: string;
  investor_id: string;
  investor_name: string;
  investment_count: number;
  invested_total: string;
  expected_return: string;
  expected_roi_percent: string;
  expected_repayment_total: string;
  scheduled_total: string;
  actual_return: string;
  remaining_total: string;
  next_repayment_date: string | null;
  status: "pending_schedule" | "scheduled" | "overdue" | "completed";
}

const asPage = <T>(value: PaginatedResponse<T> | T[]): PaginatedResponse<T> =>
  Array.isArray(value)
    ? { count: value.length, next: null, previous: null, results: value }
    : value;

const repaymentService = {
  list: async (params: { status?: string; ordering?: string } = {}) =>
    asPage<RepaymentRecord>(await api.get("repayments/", { params })),
  summary: async (): Promise<RepaymentSummary> => await api.get("repayments/summary/"),
  listPlans: async (params: { status?: string; ordering?: string } = {}): Promise<PaginatedResponse<RepaymentPlan>> =>
    asPage<RepaymentPlan>(await api.get("repayment-plans/", { params: { page_size: 100, ...params } })),
  listEligibleInvestments: async (): Promise<EligibleRepaymentInvestment[]> =>
    await api.get("repayment-plans/eligible-investments/"),
  submitPlan: async (payload: { investment: string; notes?: string; installments: RepaymentPlanInstallment[] }): Promise<RepaymentPlan> =>
    await api.post("repayment-plans/", payload),
  resubmitPlan: async (id: string, payload: { investment: string; notes?: string; installments: RepaymentPlanInstallment[] }): Promise<RepaymentPlan> =>
    await api.put(`repayment-plans/${id}/`, payload),
  startPlanReview: async (id: string): Promise<RepaymentPlan> =>
    await api.post(`repayment-plans/${id}/start-review/`, {}),
  approvePlan: async (id: string, review_notes = ""): Promise<RepaymentPlan> =>
    await api.post(`repayment-plans/${id}/approve/`, { review_notes }),
  requestPlanRevision: async (id: string, review_notes: string): Promise<RepaymentPlan> =>
    await api.post(`repayment-plans/${id}/request-revision/`, { review_notes }),
  rejectPlan: async (id: string, review_notes: string): Promise<RepaymentPlan> =>
    await api.post(`repayment-plans/${id}/reject/`, { review_notes }),
  submitTransfer: async (payload: {
    repayment: string;
    inbound_reference: string;
    inbound_transfer_date: string;
    receipt?: File | null;
    source_of_funds_declaration?: string;
    agreement_accepted: boolean;
  }): Promise<RepaymentTransfer> => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        body.append(key, value instanceof File ? value : String(value));
      }
    });
    return await api.post("repayment-transfers/", body, { headers: { "Content-Type": "multipart/form-data" } });
  },
  listTransfers: async (params: { repayment?: string; status?: string } = {}): Promise<PaginatedResponse<RepaymentTransfer>> =>
    asPage<RepaymentTransfer>(await api.get("repayment-transfers/", { params: { page_size: 100, ...params } })),
  reviewTransfer: async (id: string, review_notes = ""): Promise<RepaymentTransfer> =>
    await api.post(`repayment-transfers/${id}/review/`, { review_notes }),
  verifyTransfer: async (id: string, review_notes: string): Promise<RepaymentTransfer> =>
    await api.post(`repayment-transfers/${id}/verify/`, { review_notes }),
  rejectTransfer: async (id: string, review_notes: string): Promise<RepaymentTransfer> =>
    await api.post(`repayment-transfers/${id}/reject/`, { review_notes }),
  disburseTransfer: async (id: string, payload: { outbound_reference: string; actual_payment_date?: string }): Promise<RepaymentTransfer> =>
    await api.post(`repayment-transfers/${id}/disburse/`, payload),
};

export default repaymentService;
