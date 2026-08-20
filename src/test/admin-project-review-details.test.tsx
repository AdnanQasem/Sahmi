import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import AdminProjectReviewDetails from "@/components/admin/AdminProjectReviewDetails";
import { matchesEditImageReviewFilters } from "@/components/admin/AdminEditImageReviews";
import type { Project } from "@/services/projectsService";

const renderReview = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const project = {
  id: "project-1",
  title: "Solar Workshop",
  slug: "solar-workshop",
  description: "Workshop description",
  short_description: "Solar workshop",
  category: "category-2",
  category_detail: { id: "category-2", name: "Technology", slug: "technology" },
  location: "Gaza",
  goal_amount: "2400.00",
  funded_amount: "0.00",
  funding_account: { secured: "0.00", released: "0.00", refunded: "0.00", available: "0.00" },
  minimum_investment: "100.00",
  expected_roi: "10.00",
  faqs: [{ question: "How is progress checked?", answer: "The admin reviews milestone evidence." }],
  cost_items: [{ name: "Solar panels", description: "550W panels", quantity: "20", unit_cost: "120" }],
  milestones: [{ id: "m1", title: "Install panels", description: "Complete installation", target_date: "2027-02-15", status: "in_progress", deliverables: "Installed array", percentage_of_project: "100", funding_released: "1200", order: 1 }],
  funding_period_days: 30,
  status: "fundraising",
  is_verified: true,
  investor_count: 0,
  days_left: 30,
  funding_percent: 0,
  repayment_status: "on_track",
  business_plan: "https://api.example.test/media/business-plan.pdf",
  financial_projections: "https://api.example.test/media/financial-projections.pdf",
  ownership_proof: "https://api.example.test/media/ownership-proof.pdf",
  created_at: "2026-08-14T10:00:00Z",
  pending_edit_request: {
    id: "edit-1",
    payload: {},
    files: { financial_projections: "https://api.example.test/media/proposed-financial-projections.pdf" },
    images: [],
    submitted_by: "owner-1",
    created_at: "2026-08-14T10:00:00Z",
    changes: {
      category: { before: "Agriculture", after: "Technology" },
      cost_items: {
        before: [{ name: "Panels", description: "Old panels", quantity: "10", unit_cost: "100" }],
        after: [{ name: "Solar panels", description: "550W panels", quantity: "20", unit_cost: "120" }],
      },
      milestones: {
        before: [],
        after: [{ id: "m1", title: "Install panels", description: "Complete installation", target_date: "2027-02-15", status: "in_progress", deliverables: "Installed array", percentage_of_project: "100", funding_released: "1200", order: 1 }],
      },
      faqs: {
        before: [],
        after: [{ question: "How is progress checked?", answer: "The admin reviews milestone evidence." }],
      },
    },
  },
} as Project;

describe("editing request review details", () => {
  it("renders category names, calculated cost tables, and a readable timeline", () => {
    renderReview(<AdminProjectReviewDetails project={project} isEditReview />);

    expect(screen.getByText("Agriculture")).toBeInTheDocument();
    expect(screen.getAllByText("Technology").length).toBeGreaterThan(0);
    expect(screen.getByText("550W panels")).toBeInTheDocument();
    expect(screen.getAllByText("$2,400.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Install panels")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText(/Feb 15, 2027/)).toBeInTheDocument();
    expect(screen.getByText("How is progress checked?")).toBeInTheDocument();
    expect(screen.getByText("The admin reviews milestone evidence.")).toBeInTheDocument();
    expect(screen.queryByText(/"question"/)).not.toBeInTheDocument();
    expect(screen.getByText("Required project documents")).toBeInTheDocument();
    expect(screen.getByText("Business plan")).toBeInTheDocument();
    expect(screen.getByText("Financial projections")).toBeInTheDocument();
    expect(screen.getByText("Ownership or registration evidence")).toBeInTheDocument();
    const currentLinks = screen.getAllByRole("link", { name: "View current" });
    expect(currentLinks).toHaveLength(3);
    expect(currentLinks[0]).toHaveAttribute("href", "https://api.example.test/media/business-plan.pdf");
    expect(screen.getByRole("link", { name: "View proposed replacement" })).toHaveAttribute(
      "href",
      "https://api.example.test/media/proposed-financial-projections.pdf",
    );
  });

  it("filters picture reviews by project and review status", () => {
    expect(matchesEditImageReviewFilters("project-1", "approved", "all", "all")).toBe(true);
    expect(matchesEditImageReviewFilters("project-1", "approved", "project-1", "approved")).toBe(true);
    expect(matchesEditImageReviewFilters("project-1", "rejected", "project-2", "all")).toBe(false);
    expect(matchesEditImageReviewFilters("project-1", "needs_revision", "all", "approved")).toBe(false);
  });
});
