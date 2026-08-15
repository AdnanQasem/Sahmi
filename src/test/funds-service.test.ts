import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/services/api";
import fundsService from "@/services/fundsService";

vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("fundsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses dedicated review and simulated-release endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ id: "withdrawal-1" });

    await fundsService.review("withdrawal-1");
    await fundsService.approve("withdrawal-1", "Evidence verified");
    await fundsService.release("withdrawal-1");
    await fundsService.cancel("withdrawal-1");

    expect(api.post).toHaveBeenNthCalledWith(1, "withdrawals/withdrawal-1/review/", {});
    expect(api.post).toHaveBeenNthCalledWith(2, "withdrawals/withdrawal-1/approve/", {
      review_notes: "Evidence verified",
    });
    expect(api.post).toHaveBeenNthCalledWith(3, "withdrawals/withdrawal-1/release/", {});
    expect(api.post).toHaveBeenNthCalledWith(4, "withdrawals/withdrawal-1/cancel/", {});
  });

  it("submits evidence as multipart form data", async () => {
    vi.mocked(api.post).mockResolvedValue({ id: "withdrawal-2" });
    const evidence = new File(["invoice"], "invoice.pdf", { type: "application/pdf" });

    await fundsService.create({
      milestone: "milestone-1",
      amount: "3000.00",
      evidence_description: "Supplier invoice",
      planned_expenses: "Purchase materials",
      evidence_file: evidence,
    });

    const body = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(body.get("milestone")).toBe("milestone-1");
    expect(body.get("amount")).toBe("3000.00");
    expect(body.get("evidence_file")).toBe(evidence);
  });

  it("submits and reviews milestone completion evidence through dedicated endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ id: "milestone-1" });
    const evidence = new File(["final evidence"], "completion.pdf", { type: "application/pdf" });

    await fundsService.submitMilestoneCompletion("milestone-1", {
      summary: "The milestone work is complete.",
      evidence,
    });
    await fundsService.reviewMilestoneCompletion("milestone-1");
    await fundsService.approveMilestoneCompletion("milestone-1", "Verified");
    await fundsService.requestMilestoneCompletionRevision("milestone-1", "Add clearer photos");
    await fundsService.rejectMilestoneCompletion("milestone-1", "Evidence is invalid");

    const completionBody = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(completionBody.get("completion_summary")).toBe("The milestone work is complete.");
    expect(completionBody.get("completion_evidence")).toBe(evidence);
    expect(api.post).toHaveBeenNthCalledWith(2, "milestones/milestone-1/review-completion/", {});
    expect(api.post).toHaveBeenNthCalledWith(3, "milestones/milestone-1/approve-completion/", { review_notes: "Verified" });
    expect(api.post).toHaveBeenNthCalledWith(4, "milestones/milestone-1/request-completion-revision/", { review_notes: "Add clearer photos" });
    expect(api.post).toHaveBeenNthCalledWith(5, "milestones/milestone-1/reject-completion/", { review_notes: "Evidence is invalid" });
  });
});
