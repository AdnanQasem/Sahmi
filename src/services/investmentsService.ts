import api from "./api";
import { PaginatedResponse, Project } from "./projectsService";

export interface InvestmentPayload {
  project: string;
  amount: string;
  quantity?: number;
  payment_method: "card" | "bank_transfer" | "paypal";
  transaction_id?: string;
  notes?: string;
}

export interface Investment {
  id: string;
  investor: string;
  project: string;
  project_detail?: Project;
  amount: string;
  quantity: number;
  investment_date: string;
  status: "pending" | "confirmed" | "canceled" | "completed";
  transaction_id: string;
  payment_method: "card" | "bank_transfer" | "paypal";
  expected_return: string;
  actual_return: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const investmentsService = {
  listInvestments: async (): Promise<PaginatedResponse<Investment>> => {
    return await api.get("investments/", { params: { page_size: 100, ordering: "-investment_date" } });
  },

  createInvestment: async (payload: InvestmentPayload): Promise<Investment> => {
    return await api.post("investments/", payload);
  },
};

export default investmentsService;
