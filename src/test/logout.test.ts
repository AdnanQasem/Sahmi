import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/services/api", () => ({ default: { post: mocks.post } }));
import authService from "@/services/authService";

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
it("calls backend logout and clears local credentials", async () => {
  localStorage.setItem("accessToken", "access"); localStorage.setItem("refreshToken", "refresh"); localStorage.setItem("user", "{}");
  mocks.post.mockResolvedValue({});
  await authService.logout();
  expect(mocks.post).toHaveBeenCalledWith("auth/logout/", { refresh: "refresh" });
  expect(localStorage.getItem("accessToken")).toBeNull(); expect(localStorage.getItem("refreshToken")).toBeNull(); expect(localStorage.getItem("user")).toBeNull();
});
it("clears credentials even when backend logout fails", async () => {
  localStorage.setItem("refreshToken", "bad"); mocks.post.mockRejectedValue(new Error("network"));
  await expect(authService.logout()).rejects.toThrow();
  expect(localStorage.getItem("refreshToken")).toBeNull();
});