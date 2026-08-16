import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ProjectCard from "@/components/ProjectCard";

describe("funding progress cards", () => {
  it("shows the real funding percentage while capping the visual bar", () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={{
            id: "project-1",
            title: "Overfunded project",
            description: "Project description",
            category: "Technology",
            founder: "Founder",
            image: "/placeholder.svg",
            goal: 10000,
            raised: 13100,
            investors: 20,
            daysLeft: 12,
            status: "fully_funded",
            repaymentStatus: "on_track",
            verified: true,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("131%")).toBeInTheDocument();
    expect(screen.getAllByText("Fully Funded").length).toBeGreaterThan(0);
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveStyle({ width: "100%" });
    expect(progress).toHaveAttribute("aria-valuetext", "131%");
  });

  it.each([
    ["implementation" as const, "on_track" as const, "In Implementation"],
    ["completed" as const, "on_track" as const, "Repaying Investors"],
    ["completed" as const, "completed" as const, "Project Completed"],
  ])("shows the correct post-funding badge for %s projects with a %s repayment plan", (status, repaymentStatus, label) => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={{
            id: status,
            title: `${label} project`,
            description: "Project description",
            category: "Technology",
            founder: "Founder",
            image: "/placeholder.svg",
            goal: 10000,
            raised: 10000,
            investors: 20,
            daysLeft: 0,
            status,
            repaymentStatus,
            verified: true,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
  });
});
