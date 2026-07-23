import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService, { User } from "@/services/authService";
import { getErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          await changeLanguage(userData.preferred_language);
          setUser(userData);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          await authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      await changeLanguage(data.preferred_language);
      setUser(data);
      toast.success(t("auth.welcomeBack"));
    } catch (error: any) {
      const message = getErrorMessage(error, t("auth.invalidCredentials"));
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      await authService.register(data);
      toast.success(t("auth.registrationSuccess"));
    } catch (error: any) {
      const message = getErrorMessage(error, t("auth.registrationFailed"));
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      toast.info(t("auth.signedOut"));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
