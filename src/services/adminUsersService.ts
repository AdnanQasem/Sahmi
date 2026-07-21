import api from "./api";

export type AdminUserType = "investor" | "entrepreneur" | "admin";
export type InvestorTier = "bronze" | "silver" | "gold" | "platinum";
export type RiskPreference = "low" | "medium" | "high";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  user_type: AdminUserType;
  profile_picture: string | null;
  bio: string;
  country: string;
  city: string;
  is_verified: boolean;
  is_kyc_verified: boolean;
  kyc_document: string | null;
  kyc_verified_at: string | null;
  investor_tier: InvestorTier;
  total_invested: string;
  total_returned: string;
  average_roi: string;
  risk_preference: RiskPreference;
  business_name: string;
  business_registration_number: string;
  business_established_date: string | null;
  business_address: string;
  total_funded: string;
  total_repaid: string;
  reputation_score: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: number[];
  user_permissions: number[];
  last_login: string | null;
  date_joined: string;
}

export interface AdminUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface AdminUsersListParams {
  search?: string;
  user_type?: AdminUserType;
  is_active?: boolean;
  is_verified?: boolean;
  is_kyc_verified?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  investor_tier?: InvestorTier;
  risk_preference?: RiskPreference;
  country?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface AdminUserWritePayload {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  phone_number?: string;
  user_type?: AdminUserType;
  profile_picture?: File | null;
  bio?: string;
  country?: string;
  city?: string;
  is_verified?: boolean;
  is_kyc_verified?: boolean;
  kyc_document?: File | null;
  kyc_verified_at?: string | null;
  investor_tier?: InvestorTier;
  total_invested?: string;
  total_returned?: string;
  average_roi?: string;
  risk_preference?: RiskPreference;
  business_name?: string;
  business_registration_number?: string;
  business_established_date?: string | null;
  business_address?: string;
  total_funded?: string;
  total_repaid?: string;
  reputation_score?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  groups?: number[];
  user_permissions?: number[];
}

export interface AdminResetPasswordPayload {
  password: string;
  confirm_password: string;
}

const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

const toFormData = (payload: AdminUserWritePayload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    if (isFile(value)) {
      formData.append(key, value);
      return;
    }

    formData.append(key, value === null ? "" : String(value));
  });

  return formData;
};

const splitUploads = (payload: AdminUserWritePayload) => {
  const fields: AdminUserWritePayload = {};
  const uploads: AdminUserWritePayload = {};

  Object.entries(payload).forEach(([key, value]) => {
    const typedKey = key as keyof AdminUserWritePayload;
    if (isFile(value)) {
      Object.assign(uploads, { [typedKey]: value });
    } else {
      Object.assign(fields, { [typedKey]: value });
    }
  });

  return { fields, uploads };
};

const adminUsersService = {
  listUsers: async (params: AdminUsersListParams = {}): Promise<AdminUsersResponse> => {
    return await api.get("admin/users/", { params });
  },

  getUser: async (id: string): Promise<AdminUser> => {
    return await api.get(`admin/users/${id}/`);
  },

  createUser: async (payload: AdminUserWritePayload): Promise<AdminUser> => {
    const hasUpload = Object.values(payload).some(isFile);
    return await api.post(
      "admin/users/",
      hasUpload ? toFormData(payload) : payload,
      hasUpload ? { headers: { "Content-Type": "multipart/form-data" } } : undefined,
    );
  },

  updateUser: async (id: string, payload: AdminUserWritePayload): Promise<AdminUser> => {
    const { fields, uploads } = splitUploads(payload);
    const hasUploads = Object.keys(uploads).length > 0;

    if (!hasUploads) {
      return await api.patch(`admin/users/${id}/`, fields);
    }

    // Send ordinary fields as JSON first so nulls and empty many-to-many lists
    // retain their meaning. Multipart forms cannot represent an empty list to
    // DRF, which otherwise makes clearing groups or permissions silently fail.
    if (Object.keys(fields).length > 0) {
      await api.patch(`admin/users/${id}/`, fields);
    }

    return await api.patch(`admin/users/${id}/`, toFormData(uploads), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`admin/users/${id}/`);
  },

  resetPassword: async (id: string, payload: AdminResetPasswordPayload): Promise<{ message?: string }> => {
    return await api.post(`admin/users/${id}/reset-password/`, payload);
  },
};

export default adminUsersService;
