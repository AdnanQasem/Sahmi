import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectTimelineEditor from "@/components/projects/ProjectTimelineEditor";
import {
  emptyProjectMilestone,
  milestonePercentageTotal,
  redistributeMilestonePercentages,
  validateProjectMilestones,
} from "@/lib/projectMilestones";
import type { ProjectMilestone } from "@/services/projectsService";

const milestones: ProjectMilestone[] = [
  {
    id: "milestone-1",
    title: "Procurement",
    description: "Purchase the required equipment.",
    target_date: "2027-02-01",
    status: "completed",
    deliverables: "Installed equipment",
    percentage_of_project: "40",
    funding_released: "4000",
    order: 1,
  },
  {
    id: "milestone-2",
    title: "Launch",
    description: "Open the workshop.",
    target_date: "2027-04-01",
    status: "pending",
    deliverables: "Operational workshop",
    percentage_of_project: "60",
    funding_released: "0",
    order: 2,
  },
];

describe("project milestones", () => {
  it("validates chronological milestones totaling one hundred percent", () => {
    expect(milestonePercentageTotal(milestones)).toBe(100);
    expect(validateProjectMilestones(milestones)).toBeNull();
    expect(
      validateProjectMilestones([
        { ...milestones[0], percentage_of_project: "30" },
        { ...milestones[1], percentage_of_project: "60" },
      ]),
    ).toMatch(/total 100/i);
    expect(
      validateProjectMilestones([
        { ...milestones[0], target_date: "2027-05-01" },
        { ...milestones[1], target_date: "2027-03-01" },
      ]),
    ).toMatch(/ordered by target date/i);
  });

  it("automatically redistributes percentages when rows are added", () => {
    const redistributed = redistributeMilestonePercentages([
      emptyProjectMilestone(0),
      emptyProjectMilestone(1),
      emptyProjectMilestone(2),
    ]);

    expect(redistributed.map((item) => item.order)).toEqual([1, 2, 3]);
    expect(redistributed.map((item) => item.percentage_of_project)).toEqual([
      "33.33",
      "33.33",
      "33.34",
    ]);
    expect(milestonePercentageTotal(redistributed)).toBe(100);
  });

  it("renders the public implementation timeline", () => {
    render(<ProjectTimeline milestones={milestones} />);

    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.getByText("Installed equipment")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("adds an automatically numbered milestone and balances allocation", () => {
    const Harness = () => {
      const [items, setItems] = useState<ProjectMilestone[]>([emptyProjectMilestone()]);
      return <ProjectTimelineEditor milestones={items} onChange={setItems} />;
    };
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add milestone/i }));

    expect(screen.getByText("Milestone 2")).toBeInTheDocument();
    const percentageInputs = screen.getAllByLabelText("Share of project (%)");
    expect(percentageInputs[0]).toHaveValue(50);
    expect(percentageInputs[1]).toHaveValue(50);
  });
});
