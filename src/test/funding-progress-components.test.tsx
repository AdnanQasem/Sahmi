import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ProjectCard from "@/components/ProjectCard";

describe("funding progress cards", () => {
  it("caps the funding label and visual bar at 100 percent", () => {
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
            repaymentStatus: "on_track",
            verified: true,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Funding completed. Implementation can now begin.")).toBeInTheDocument();
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveStyle({ width: "100%" });
    expect(progress).toHaveAttribute("aria-valuetext", "100%");
  });
});
