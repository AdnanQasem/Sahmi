import axios, { InternalAxiosRequestConfig } from "axios";

// Base API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1/";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const unwrapResponse = (data: any) => {
  if (data && data.data !== undefined) {
    return data.data;
  }
  return data;
};

const getErrorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as any;
  return data?.error?.message ?? data?.message ?? data?.detail ?? fallback;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle StandardJSONRenderer envelope
api.interceptors.response.use(
  (response) => {
    // Django backend wraps data in { "success": true, "data": ..., "message": ... }
    return unwrapResponse(response.data);
  },
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // Handle Token Expiry (401)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}auth/refresh-token/`, {
            refresh: refreshToken,
          });
          
          const data = unwrapResponse(res.data);

          if (data?.access) {
            localStorage.setItem("accessToken", data.access);
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token also invalid, logout user
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { getErrorMessage };
