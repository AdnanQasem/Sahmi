import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminMilestoneDialog from "@/components/admin/AdminMilestoneDialog";
import type { AdminMilestone } from "@/services/adminFinanceService";

const milestone: AdminMilestone = {
  id: "milestone-1",
  project: "project-1",
  title: "Installation",
  description: JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Install the equipment safely." }] }],
  }),
  target_date: "2027-02-15",
  actual_completion_date: null,
  status: "pending",
  deliverables: JSON.stringify(["Installed equipment", "Inspection report"]),
  percentage_of_project: "100.00",
  funding_released: "0.00",
  order: 4,
  created_at: "2026-08-21T10:00:00Z",
  updated_at: "2026-08-21T10:00:00Z",
};

describe("AdminMilestoneDialog", () => {
  it("shows stored structured content as normal text and hides display order", () => {
    render(
      <AdminMilestoneDialog
        open
        milestone={milestone}
        projects={[{ id: "project-1", title: "Solar Project", slug: "solar-project" }]}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Install the equipment safely.")).toBeInTheDocument();
    expect(screen.getByLabelText("Deliverables")).toHaveValue(
      "Installed equipment\nInspection report",
    );
    expect(screen.queryByLabelText(/display order/i)).not.toBeInTheDocument();
  });

  it("preserves internal ordering by omitting order from the edit payload", () => {
    const onSubmit = vi.fn();
    render(
      <AdminMilestoneDialog
        open
        milestone={milestone}
        projects={[{ id: "project-1", title: "Solar Project", slug: "solar-project" }]}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save milestone/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("order");
    expect(onSubmit.mock.calls[0][0].description).toBe("Install the equipment safely.");
  });
});
