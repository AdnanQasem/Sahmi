import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectUpdateChange from "@/components/projects/ProjectUpdateChange";

describe("project update changes", () => {
  it("renders structured cost and milestone data without raw JSON", () => {
    const { container, rerender } = render(<ProjectUpdateChange field="cost_items" change={{
      before: [],
      after: [{ name: "1", description: "550W solar panels", quantity: "20", unit_cost: "120" }],
    }} />);
    expect(screen.getByText("550W solar panels")).toBeInTheDocument();
    expect(screen.getAllByText("$2,400.00").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('"unit_cost"');

    rerender(<ProjectUpdateChange field="milestones" change={{
      before: [],
      after: [{ title: "Install panels", description: "Complete installation", target_date: "2027-02-15", deliverables: "Installed array", percentage_of_project: "50", order: 1 }],
    }} />);
    expect(screen.getByText("Install panels")).toBeInTheDocument();
    expect(screen.getByText("Installed array", { exact: false })).toBeInTheDocument();
    expect(container.textContent).not.toContain('"target_date"');
  });

  it("renders FAQs and uploaded assets as readable cards", () => {
    const { container, rerender } = render(<ProjectUpdateChange field="faqs" change={{
      before: [],
      after: [{ question: "When does it open?", answer: "After implementation." }],
    }} />);
    expect(screen.getByText(/When does it open/)).toBeInTheDocument();
    expect(screen.getByText("After implementation.")).toBeInTheDocument();

    rerender(<ProjectUpdateChange field="images" change={{
      before: [],
      after: [{ image: "project-images/random-code.png", alt_text: "Equipment preview" }],
    }} />);
    expect(screen.getByText("Equipment preview")).toBeInTheDocument();
    expect(container.textContent).not.toContain("random-code.png");
  });
});
