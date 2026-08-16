import api from "./api";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  user_type: "investor" | "entrepreneur" | "admin";
  is_staff: boolean;
  preferred_language: "en" | "ar";
  phone_number?: string;
  country?: string;
  city?: string;
  website?: string;
  timezone?: string;
  bio?: string;
  business_name?: string;
  business_registration_number?: string;
  business_established_date?: string | null;
  business_address?: string;
  risk_preference?: "low" | "medium" | "high";
  profile_picture?: string | null;
  is_verified?: boolean;
  email_verified?: boolean;
  email_verified_at?: string | null;
  is_kyc_verified?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  email_confirmation_sent?: boolean;
}

export interface RegistrationPendingResponse {
  message: string;
  email_confirmation_sent: true;
}

export interface RegisterPayload {
  username?: string;
  email: string;
  name?: string;
  full_name?: string;
  password: string;
  user_type?: User["user_type"];
  phone_number?: string;
  country?: string;
  city?: string;
  website?: string;
  timezone?: string;
  business_name?: string;
  business_registration_number?: string;
  business_established_date?: string | null;
  business_address?: string;
  risk_preference?: "low" | "medium" | "high";
}


export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const res: AuthResponse = await api.post("auth/login/", { email, password });
    const { access, refresh, user } = res;
    
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("user", JSON.stringify(user));
    
    return user;
  },

  register: async (userData: RegisterPayload): Promise<RegistrationPendingResponse> => {
    return await api.post("auth/register/", userData);
  },

  verifyEmail: async (uid: string, token: string): Promise<AuthResponse & { message: string }> =>
    api.post("auth/verify-email/", { uid, token }),

  resendEmailVerification: async (email: string): Promise<{ message: string }> =>
    api.post("auth/verify-email/resend/", { email }),

  logout: async () => {
    const refresh = localStorage.getItem("refreshToken");
    try {
      if (refresh) {
        await api.post("auth/logout/", { refresh });
      }
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  updateCurrentUser: async (payload: Partial<Pick<User, "email" | "preferred_language" | "full_name" | "phone_number" | "country" | "city" | "website" | "timezone" | "bio" | "business_name" | "business_registration_number" | "business_established_date" | "business_address" | "risk_preference" | "profile_picture">>): Promise<User> => {
    const user: User = await api.patch("auth/me/", payload);
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  uploadProfilePicture: async (file: File): Promise<User> => {
    const payload = new FormData();
    payload.append("profile_picture", file);
    const user: User = await api.patch("auth/me/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  getCurrentUser: async (): Promise<User> => {
    return await api.get("auth/me/");
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message?: string }> => {
    return await api.post("auth/change-password/", payload);
  },

  requestPasswordReset: async (email: string): Promise<PasswordResetRequestResponse> => {
    return await api.post("auth/password-reset/", { email });
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload): Promise<{ message: string }> => {
    return await api.post("auth/password-reset/confirm/", payload);
  },
};

export default authService;
