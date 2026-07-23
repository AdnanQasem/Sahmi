import { beforeEach, expect, it } from "vitest";
import { storeRefreshPayload } from "@/services/api";
beforeEach(() => localStorage.clear());
it("stores the rotated refresh token with the new access token", () => {
  localStorage.setItem("refreshToken", "old"); storeRefreshPayload({ access: "new-access", refresh: "new-refresh" });
  expect(localStorage.getItem("accessToken")).toBe("new-access"); expect(localStorage.getItem("refreshToken")).toBe("new-refresh");
});