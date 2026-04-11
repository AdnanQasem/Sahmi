import api from "./api";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  user_type: "investor" | "entrepreneur" | "admin";
  profile_picture?: string;
  is_verified?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await api.post("auth/login/", { email, password });
    const { access, refresh, user } = res as any;
    
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("user", JSON.stringify(user));
    
    return user;
  },

  register: async (userData: any): Promise<any> => {
    return await api.post("auth/register/", userData);
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  getCurrentUser: async (): Promise<User> => {
    return await api.get("auth/me/");
  },
};

export default authService;
