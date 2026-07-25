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
  profile_picture?: string;
  is_verified?: boolean;
  is_kyc_verified?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
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

  register: async (userData: RegisterPayload): Promise<AuthResponse> => {
    return await api.post("auth/register/", userData);
  },

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

  updateCurrentUser: async (payload: Partial<Pick<User, "preferred_language" | "full_name" | "phone_number" | "country" | "city" | "website" | "timezone" | "bio">>): Promise<User> => {
    const user: User = await api.patch("auth/me/", payload);
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
