import axios, { InternalAxiosRequestConfig } from "axios";
import i18n from "@/i18n";

// Base API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1/";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" ? value as Record<string, unknown> : {};

const unwrapResponse = <T,>(data: T | { data: T }): T => {
  if (data !== null && typeof data === "object" && "data" in data) {
    return data.data;
  }
  return data;
};

const getErrorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = asRecord(error.response?.data);
  const nestedError = asRecord(data.error);
  const code = data.code ?? nestedError.code;
  if (typeof code === "string" && i18n.exists(`errors.codes.${code}`)) {
    return i18n.t(`errors.codes.${code}`);
  }
  const statusKey: Record<number, string> = { 401: "unauthorized", 403: "forbidden", 404: "notFound" };
  const translatedStatus = error.response?.status ? statusKey[error.response.status] : undefined;
  if (typeof data.message === "string") {
    return translateServerMessage(data.message);
  }
  if (typeof data.detail === "string") {
    return translateServerMessage(data.detail);
  }
  if (typeof data.error === "string") {
    return translateServerMessage(data.error);
  }
  if (typeof nestedError.message === "string") {
    return translateServerMessage(nestedError.message);
  }
  if (data.error && typeof data.error === "object") {
    const first = Object.values(nestedError)[0];
    if (Array.isArray(first) && first[0]) {
      return translateServerMessage(String(first[0]));
    }
    if (typeof first === "string") {
      return translateServerMessage(first);
    }
  }
  if (Object.keys(data).length) {
    const fields = getFieldErrors(error);
    const first = Object.values(fields)[0];
    if (first) return first;
  }
  if (translatedStatus) return i18n.t(`errors.${translatedStatus}`);
  if (!error.response) return i18n.t("errors.network");
  return fallback;
};

const getFieldErrors = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const data = asRecord(error.response?.data);
  const source = data.error && typeof data.error === "object" ? asRecord(data.error) : data;
  if (!source || typeof source !== "object") {
    return {};
  }

  return Object.entries(source).reduce<Record<string, string>>((acc, [field, value]) => {
    if (Array.isArray(value)) {
      acc[field] = value.map((item) => translateServerMessage(String(item))).join(" ");
    } else if (typeof value === "string") {
      acc[field] = translateServerMessage(value);
    } else if (value && typeof value === "object") {
      acc[field] = Object.values(value).flat().map((item) => translateServerMessage(String(item))).join(" ");
    }
    return acc;
  }, {});
};

export const storeRefreshPayload = (data: { access?: string; refresh?: string }) => {
  if (data.access) localStorage.setItem("accessToken", data.access);
  if (data.refresh) localStorage.setItem("refreshToken", data.refresh);
};

const serverMessageKeys: Record<string, string> = {
  "A user with this email already exists.": "emailExists",
  "User does not exist.": "userNotFound",
  "Project does not exist.": "projectNotFound",
  "Message body is empty.": "messageEmpty",
  "Message body cannot be empty.": "messageEmpty",
  "Add a message or an attachment.": "messageEmpty",
  "Message attachments may not exceed 10 MB.": "attachmentSize",
  "This attachment file type is not supported.": "attachmentType",
  "The attachment content type does not match its file extension.": "attachmentType",
  "The uploaded attachment is not a valid PDF document.": "attachmentType",
  "The uploaded attachment is not a valid image.": "attachmentType",
  "Amount must be greater than zero.": "amountPositive",
  "Full name is required.": "fullNameRequired",
  "Current password is incorrect.": "currentPasswordIncorrect",
  "New passwords do not match.": "passwordsMismatch",
  "Email is required.": "emailRequired",
  "Password is required.": "passwordRequired",
  "Invalid email or password.": "invalidCredentials",
  "This account is disabled.": "accountDisabled",
  "Choose a valid time zone.": "timezoneInvalid",
  "Profile pictures may not exceed 5 MB.": "profilePictureSize",
  "Cost items must be a list.": "costItemsList",
  "Add at least one project cost item.": "costItemRequired",
  "A project cost table may contain at most 50 items.": "costItemLimit",
  "Milestones must be a list.": "milestonesList",
  "Add at least one project milestone.": "milestoneRequired",
  "A project timeline may contain at most 20 milestones.": "milestoneLimit",
  "Funding goal must be greater than zero.": "fundingGoalPositive",
  "Minimum investment must be greater than zero.": "minimumInvestmentPositive",
  "Campaign duration must be greater than zero.": "campaignDurationPositive",
  "Project documents may not exceed 10 MB.": "documentSize",
  "Project documents must be PDF files.": "documentPdf",
  "The uploaded file does not have a PDF content type.": "documentPdf",
  "The uploaded file is not a valid PDF document.": "documentPdfInvalid",
  "Not a participant.": "notParticipant",
  "Only the sender may edit this message.": "senderEditOnly",
  "Only the sender may delete this message.": "senderDeleteOnly",
  "You can only cancel your own investments.": "cancelOwnInvestment",
  "Only pending investments can be cancelled.": "cancelPendingInvestment",
  "Investments must be sent back before deleting this entrepreneur account.": "entrepreneurInvestmentsMustBeReturned",
  "Return of investments must be done before deleting this entrepreneur account.": "entrepreneurReturnsMustBeCompleted",
};

const translateServerMessage = (message: string) => {
  const exceeding = message.match(/^Exceeding value\. Remaining funding is (.+)\.$/);
  if (exceeding) {
    return i18n.t("projects.exceedingValue", { amount: exceeding[1] });
  }
  const key = serverMessageKeys[message.trim()];
  if (key) return i18n.t(`errors.server.${key}`);
  return i18n.resolvedLanguage?.startsWith("ar") ? i18n.t("errors.validation") : message;
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
    config.headers["Accept-Language"] = i18n.resolvedLanguage?.startsWith("ar") ? "ar" : "en";
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
            storeRefreshPayload(data);
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
export { getErrorMessage, getFieldErrors };
