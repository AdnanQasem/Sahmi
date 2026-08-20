import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import AdminReviewFeedback from "@/components/projects/AdminReviewFeedback";

it("shows the exact administrator feedback the entrepreneur must address", () => {
  render(<AdminReviewFeedback feedback={[{
    id: "project-edit:1",
    scope: "project_edit",
    status: "revision_required",
    notes: "Replace the unclear ownership document and correct the funding total.",
    reviewed_at: "2030-01-02T10:00:00Z",
  }]} />);

  expect(screen.getByText("Project edit changes required")).toBeInTheDocument();
  expect(screen.getByText("Administrator note")).toBeInTheDocument();
  expect(screen.getByText("Replace the unclear ownership document and correct the funding total.")).toBeInTheDocument();
});
