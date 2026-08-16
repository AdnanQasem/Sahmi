import api from "./api";
import type { PaginatedResponse } from "./projectsService";

export type RepaymentStatus = "pending" | "due" | "paid" | "overdue" | "cancelled";
export type RepaymentTransferStatus = "submitted" | "under_review" | "verified" | "rejected" | "disbursed";

export interface RepaymentTransferSummary {
  id: string;
  status: RepaymentTransferStatus;
  inbound_reference: string;
  outbound_reference: string;
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
  submitTransfer: async (payload: {
    repayment: string;
    inbound_reference: string;
    inbound_transfer_date: string;
    receipt: File;
    source_of_funds_declaration: string;
    agreement_accepted: boolean;
  }): Promise<RepaymentTransfer> => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value instanceof File ? value : String(value)));
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
