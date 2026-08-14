import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectTimelineEditor from "@/components/projects/ProjectTimelineEditor";
import {
  emptyProjectMilestone,
  milestonePercentageTotal,
  reindexProjectMilestones,
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

  it("reindexes milestones without changing user-entered percentages", () => {
    const reindexed = reindexProjectMilestones([
      { ...emptyProjectMilestone(0), percentage_of_project: "20" },
      { ...emptyProjectMilestone(1), percentage_of_project: "30" },
    ]);

    expect(reindexed.map((item) => item.order)).toEqual([1, 2]);
    expect(reindexed.map((item) => item.percentage_of_project)).toEqual(["20", "30"]);
  });

  it("renders the public implementation timeline", () => {
    render(<ProjectTimeline milestones={milestones} />);

    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.getByText("Installed equipment")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("adds an automatically numbered milestone without changing the existing allocation", () => {
    const Harness = () => {
      const [items, setItems] = useState<ProjectMilestone[]>([
        { ...emptyProjectMilestone(), percentage_of_project: "20" },
      ]);
      return <ProjectTimelineEditor milestones={items} onChange={setItems} />;
    };
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add milestone/i }));

    expect(screen.getByText("Milestone 2")).toBeInTheDocument();
    const percentageInputs = screen.getAllByLabelText("Implementation progress share (%)");
    expect(percentageInputs[0]).toHaveValue(20);
    expect(percentageInputs[1]).toHaveValue(null);
  });

  it("removes a milestone without redistributing the remaining shares", () => {
    const Harness = () => {
      const [items, setItems] = useState<ProjectMilestone[]>([
        { ...emptyProjectMilestone(0), percentage_of_project: "20" },
        { ...emptyProjectMilestone(1), percentage_of_project: "30" },
      ]);
      return <ProjectTimelineEditor milestones={items} onChange={setItems} />;
    };
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /remove milestone 2/i }));

    expect(screen.getAllByLabelText("Implementation progress share (%)")).toHaveLength(1);
    expect(screen.getByLabelText("Implementation progress share (%)")).toHaveValue(20);
  });
});
